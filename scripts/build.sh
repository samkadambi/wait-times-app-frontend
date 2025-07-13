#!/bin/bash

# Build Scripts for Wait Times Mobile App
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Wait Times"
BUNDLE_ID="com.yourcompany.waittimes"
API_URL=${API_URL:-"https://your-production-api.elasticbeanstalk.com/api"}

echo -e "${BLUE}🚀 Building ${APP_NAME} Mobile App${NC}"

# Function to update API URL in app config
update_api_url() {
    local env=$1
    local api_url=$2
    
    echo -e "${YELLOW}📝 Updating API URL for ${env} environment...${NC}"
    
    # Update app.config.js
    sed -i.bak "s|API_URL.*|API_URL: \"${api_url}\",|g" app.config.js
    
    # Update any other config files if needed
    if [ -f "app.json" ]; then
        sed -i.bak "s|\"apiUrl\":.*|\"apiUrl\": \"${api_url}\",|g" app.json
    fi
    
    echo -e "${GREEN}✅ API URL updated to: ${api_url}${NC}"
}

# Function to build Android APK
build_android_apk() {
    local env=$1
    
    echo -e "${YELLOW}🤖 Building Android APK for ${env}...${NC}"
    
    # Install EAS CLI if not installed
    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}📦 Installing EAS CLI...${NC}"
        npm install -g @expo/eas-cli
    fi
    
    # Login to Expo if needed
    if ! eas whoami &> /dev/null; then
        echo -e "${YELLOW}🔐 Please login to Expo...${NC}"
        eas login
    fi
    
    # Build APK
    eas build --platform android --profile ${env} --non-interactive
    
    echo -e "${GREEN}✅ Android APK built successfully!${NC}"
}

# Function to build iOS Archive
build_ios_archive() {
    local env=$1
    
    echo -e "${YELLOW}🍎 Building iOS Archive for ${env}...${NC}"
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo -e "${RED}❌ iOS builds require macOS${NC}"
        exit 1
    fi
    
    # Install EAS CLI if not installed
    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}📦 Installing EAS CLI...${NC}"
        npm install -g @expo/eas-cli
    fi
    
    # Login to Expo if needed
    if ! eas whoami &> /dev/null; then
        echo -e "${YELLOW}🔐 Please login to Expo...${NC}"
        eas login
    fi
    
    # Build iOS Archive
    eas build --platform ios --profile ${env} --non-interactive
    
    echo -e "${GREEN}✅ iOS Archive built successfully!${NC}"
}

# Function to submit to app stores
submit_to_stores() {
    local env=$1
    
    echo -e "${YELLOW}📤 Submitting to app stores for ${env}...${NC}"
    
    # Submit to Google Play Store
    if [ -f "google-service-account.json" ]; then
        echo -e "${YELLOW}📱 Submitting to Google Play Store...${NC}"
        eas submit --platform android --profile ${env}
    else
        echo -e "${YELLOW}⚠️  Google Play submission skipped (no service account file)${NC}"
    fi
    
    # Submit to App Store
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}🍎 Submitting to App Store...${NC}"
        eas submit --platform ios --profile ${env}
    else
        echo -e "${YELLOW}⚠️  App Store submission skipped (requires macOS)${NC}"
    fi
    
    echo -e "${GREEN}✅ App store submission completed!${NC}"
}

# Function to create development build
build_development() {
    echo -e "${BLUE}🔧 Building Development Version${NC}"
    
    update_api_url "development" "http://localhost:3001/api"
    
    # Build for both platforms
    build_android_apk "development"
    build_ios_archive "development"
    
    echo -e "${GREEN}✅ Development builds completed!${NC}"
}

# Function to create preview build
build_preview() {
    echo -e "${BLUE}👀 Building Preview Version${NC}"
    
    update_api_url "preview" "https://your-staging-api.elasticbeanstalk.com/api"
    
    # Build for both platforms
    build_android_apk "preview"
    build_ios_archive "preview"
    
    echo -e "${GREEN}✅ Preview builds completed!${NC}"
}

# Function to create production build
build_production() {
    echo -e "${BLUE}🚀 Building Production Version${NC}"
    
    update_api_url "production" "${API_URL}"
    
    # Build for both platforms
    build_android_apk "production"
    build_ios_archive "production"
    
    echo -e "${GREEN}✅ Production builds completed!${NC}"
}

# Function to deploy to stores
deploy_to_stores() {
    echo -e "${BLUE}📤 Deploying to App Stores${NC}"
    
    submit_to_stores "production"
    
    echo -e "${GREEN}✅ Deployment to stores completed!${NC}"
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}📖 Usage:${NC}"
    echo "  $0 [command]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  dev          - Build development version"
    echo "  preview      - Build preview/staging version"
    echo "  production   - Build production version"
    echo "  deploy       - Deploy to app stores"
    echo "  all          - Build all versions"
    echo "  help         - Show this help"
    echo ""
    echo -e "${BLUE}Environment Variables:${NC}"
    echo "  API_URL      - Production API URL (default: https://your-production-api.elasticbeanstalk.com/api)"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 dev"
    echo "  $0 production"
    echo "  API_URL=https://my-api.com/api $0 production"
}

# Main script logic
case "${1:-help}" in
    "dev"|"development")
        build_development
        ;;
    "preview"|"staging")
        build_preview
        ;;
    "prod"|"production")
        build_production
        ;;
    "deploy"|"submit")
        deploy_to_stores
        ;;
    "all")
        build_development
        build_preview
        build_production
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