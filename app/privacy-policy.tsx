import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 24, 
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb'
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 16, color: '#2563eb', fontWeight: '600' }}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: '#1f2937',
            marginLeft: 16
          }}>
            Privacy Policy
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 }}>
            GoodEye Privacy Policy
          </Text>
          
          <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>

          <View style={{ gap: 24 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Information We Collect
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8 }}>
                We collect information you provide directly to us, such as when you create an account, update your profile, or contact us.
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>
                This may include:
              </Text>
              <View style={{ marginTop: 8, marginLeft: 16 }}>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Name and email address</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Profile information</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Location data when you share wait times</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Comments and updates you post</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                How We Use Your Information
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8 }}>
                We use the information we collect to:
              </Text>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Provide and improve our services</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Send you notifications about wait times and updates</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Enable social features like friends and comments</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Analyze usage patterns to improve the app</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Information Sharing
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share information in the following circumstances:
              </Text>
              <View style={{ marginTop: 8, marginLeft: 16 }}>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• With your consent</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• To comply with legal obligations</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• To protect our rights and safety</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Data Security
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Your Rights
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 8 }}>
                You have the right to:
              </Text>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Access your personal information</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Update or correct your information</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Delete your account and personal data</Text>
                <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>• Opt out of certain communications</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Changes to This Policy
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 }}>
                Contact Us
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', lineHeight: 24 }}>
                If you have any questions about this privacy policy, please contact us through the app or at our support channels.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
