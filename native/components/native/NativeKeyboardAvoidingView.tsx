import React from 'react';
import { requireNativeComponent, ViewProps, Platform, KeyboardAvoidingView } from 'react-native';

const NativeView = Platform.OS === 'android' ? requireNativeComponent<ViewProps>('NativeKeyboardAvoidingView') : null;

export const NativeKeyboardAvoidingView: React.FC<ViewProps> = (props) => {
    if (Platform.OS === 'ios') {
        // iOS native keyboard avoiding is already perfectly smooth via padding
        return (
            <KeyboardAvoidingView 
                style={props.style} 
                behavior="padding"
            >
                {props.children}
            </KeyboardAvoidingView>
        );
    }
    
    if (NativeView) {
        return <NativeView {...props} />;
    }
    
    // Fallback if something went wrong
    return <KeyboardAvoidingView behavior="padding" {...props} />;
};
