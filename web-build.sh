#!/bin/bash

# Web Build Script for Wait Times App
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Wait Times Web"
API_URL=${API_URL:-"https://your-production-api.elasticbeanstalk.com/api"}

echo -e "${BLUE}🌐 Building ${APP_NAME}${NC}"

# Function to update API URL for web
update_api_url() {
    local api_url=$1
    
    echo -e "${YELLOW}📝 Updating API URL for web...${NC}"
    
    # Update app.config.js
    sed -i.bak "s|API_URL.*|API_URL: \"${api_url}\",|g" app.config.js
    
    echo -e "${GREEN}✅ API URL updated to: ${api_url}${NC}"
}

# Function to build web version
build_web() {
    echo -e "${YELLOW}🔨 Building web version...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    # Build web version
    npx expo export --platform web
    
    echo -e "${GREEN}✅ Web build completed!${NC}"
}

# Function to deploy to AWS S3
deploy_to_s3() {
    local bucket_name=$1
    
    echo -e "${YELLOW}📤 Deploying to S3: ${bucket_name}${NC}"
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    # Sync web build to S3
    aws s3 sync web-build/ s3://${bucket_name} --delete
    
    # Configure bucket for static website hosting
    aws s3 website s3://${bucket_name} --index-document index.html --error-document index.html
    
    # Get the website URL
    local website_url=$(aws s3api get-bucket-website --bucket ${bucket_name} --query 'WebsiteEndpoint' --output text)
    
    echo -e "${GREEN}✅ Web app deployed to: http://${website_url}${NC}"
}

# Function to deploy to CloudFront (optional)
deploy_to_cloudfront() {
    local bucket_name=$1
    local distribution_id=$2
    
    echo -e "${YELLOW}☁️  Deploying to CloudFront...${NC}"
    
    # Sync to S3 first
    aws s3 sync web-build/ s3://${bucket_name} --delete
    
    # Invalidate CloudFront cache
    if [ ! -z "$distribution_id" ]; then
        aws cloudfront create-invalidation --distribution-id ${distribution_id} --paths "/*"
        echo -e "${GREEN}✅ CloudFront cache invalidated${NC}"
    fi
}

# Function to create S3 bucket
create_s3_bucket() {
    local bucket_name=$1
    local region=${2:-"us-east-1"}
    
    echo -e "${YELLOW}📦 Creating S3 bucket: ${bucket_name}${NC}"
    
    # Create bucket
    aws s3 mb s3://${bucket_name} --region ${region}
    
    # Configure for static website hosting
    aws s3 website s3://${bucket_name} --index-document index.html --error-document index.html
    
    # Set bucket policy for public read access
    aws s3api put-bucket-policy --bucket ${bucket_name} --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'${bucket_name}'/*"
            }
        ]
    }'
    
    echo -e "${GREEN}✅ S3 bucket created and configured${NC}"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}📖 Usage:${NC}"
    echo "  $0 [command] [options]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  build                    - Build web version only"
    echo "  deploy [bucket-name]     - Build and deploy to S3"
    echo "  create-bucket [name]     - Create S3 bucket for hosting"
    echo "  cloudfront [bucket] [dist-id] - Deploy with CloudFront"
    echo "  help                     - Show this help"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo "  API_URL                  - API URL (default: https://your-production-api.elasticbeanstalk.com/api)"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 build"
    echo "  $0 deploy wait-times-web"
    echo "  $0 create-bucket wait-times-web"
    echo "  API_URL=https://my-api.com/api $0 deploy my-bucket"
}

# Main script logic
case "${1:-help}" in
    "build")
        update_api_url "${API_URL}"
        build_web
        ;;
    "deploy")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please provide bucket name${NC}"
            exit 1
        fi
        update_api_url "${API_URL}"
        build_web
        deploy_to_s3 "$2"
        ;;
    "create-bucket")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Please provide bucket name${NC}"
            exit 1
        fi
        create_s3_bucket "$2"
        ;;
    "cloudfront")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}❌ Please provide bucket name and distribution ID${NC}"
            exit 1
        fi
        update_api_url "${API_URL}"
        build_web
        deploy_to_cloudfront "$2" "$3"
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac 