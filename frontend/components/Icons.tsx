import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, ...props }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
        return <LucideIcons.HelpCircle size={size} {...props} />;
    }
    return <LucideIcon size={size} {...props} />;
};
