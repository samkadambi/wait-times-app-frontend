import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Option {
  label: string;
  value: string;
}

interface AutocompleteProps {
  label: string;
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  zIndex?: number;
}

export default function Autocomplete({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  disabled = false,
  zIndex = 1,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Initialize search text with selected value
  useEffect(() => {
    if (selectedValue) {
      const selectedOption = options.find(option => option.value === selectedValue);
      setSearchText(selectedOption?.label || '');
    } else {
      setSearchText('');
    }
  }, [selectedValue, options]);

  // Filter options based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchText, options]);

  const handleSelectOption = (option: Option) => {
    setSearchText(option.label);
    onValueChange(option.value);
    setIsOpen(false);
    // Prevent blur from interfering with selection
    setTimeout(() => {
      inputRef.current?.blur();
    }, 50);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleClear = () => {
    setSearchText('');
    onValueChange('');
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, { zIndex }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.input, disabled && styles.disabled]}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          editable={!disabled}
          placeholderTextColor="#9ca3af"
        />
        {selectedValue && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
        <Pressable 
          onPress={() => setIsOpen(!isOpen)} 
          style={styles.dropdownButton}
          disabled={disabled}
        >
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6b7280" 
          />
        </Pressable>
      </View>
      
      {isOpen && filteredOptions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView 
            style={styles.scrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.map((option, index) => (
              <Pressable
                key={option.value}
                style={[
                  styles.option,
                  option.value === selectedValue && styles.selectedOption
                ]}
                onPress={() => handleSelectOption(option)}
              >
                <Text style={[
                  styles.optionText,
                  option.value === selectedValue && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                {option.value === selectedValue && (
                  <Ionicons name="checkmark" size={16} color="#2563eb" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  label: {
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabled: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  clearButton: {
    position: 'absolute',
    right: 40,
    padding: 4,
  },
  dropdownButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  selectedOptionText: {
    color: '#2563eb',
    fontWeight: '500',
  },
}); 