import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface PeopleCountInputProps {
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  quickOptions?: { label: string; value: number }[];
}

export default function PeopleCountInput({
  label,
  value,
  onValueChange,
  placeholder = "Enter exact number",
  quickOptions = [
    { label: "5+", value: 5 },
    { label: "10+", value: 10 },
    { label: "25+", value: 25 },
    { label: "50+", value: 50 },
    { label: "100+", value: 100 },
  ]
}: PeopleCountInputProps) {
  const [inputText, setInputText] = useState(value?.toString() || '');

  const handleQuickOptionPress = (optionValue: number) => {
    onValueChange(optionValue);
    setInputText(optionValue.toString());
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    const numValue = parseInt(text);
    onValueChange(isNaN(numValue) ? null : numValue);
  };

  const handleClear = () => {
    setInputText('');
    onValueChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Quick Options */}
      <View style={styles.quickOptionsContainer}>
        {quickOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickOption,
              value === option.value && styles.quickOptionSelected
            ]}
            onPress={() => handleQuickOptionPress(option.value)}
          >
            <Text style={[
              styles.quickOptionText,
              value === option.value && styles.quickOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exact Number Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          keyboardType="numeric"
          maxLength={4}
        />
        {inputText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'normal',
  },
  quickOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    fontWeight: 'normal',
  },
  quickOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickOptionText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  quickOptionTextSelected: {
    color: 'white',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 