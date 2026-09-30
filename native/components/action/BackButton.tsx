import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { StyleProp, TouchableOpacityProps, ViewStyle } from 'react-native';
import { IconButton } from './IconButton';

export interface BackButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
    buttonStyle?: StyleProp<ViewStyle>;
}

export const BackButton: React.FC<BackButtonProps> = ({ buttonStyle, ...props }) => {
    const navigation = useNavigation();

    return (
        <IconButton
            icon={ArrowLeft}
            onPress={() => navigation.goBack()}
            buttonStyle={buttonStyle}
            {...props}
        />
    );
};
