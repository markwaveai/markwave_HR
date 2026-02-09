import React from 'react';
import Svg, { Path, Line, Polyline, Rect, Circle } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    style?: any;
    fill?: string;
}

export const EditIcon: React.FC<IconProps> = ({ color = '#3b82f6', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <Path d="m15 5 4 4" />
    </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ color = '#ef4444', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M3 6h18" />
        <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <Line x1="10" y1="11" x2="10" y2="17" />
        <Line x1="14" y1="11" x2="14" y2="17" />
    </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ color = '#94a3b8', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Circle cx="11" cy="11" r="8" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({ color = '#3b82f6', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <Circle cx="9" cy="7" r="4" />
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
);

export const HeartIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, fill = 'none', style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Svg>
);

export const MessageIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Svg>
);

export const ImageIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <Circle cx="9" cy="9" r="2" />
        <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <Circle cx="12" cy="13" r="3" />
    </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ color = '#94a3b8', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M18 6 6 18" />
        <Path d="m6 6 12 12" />
    </Svg>
);

export const MailIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect width="20" height="16" x="2" y="4" rx="2" />
        <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <Circle cx="12" cy="10" r="3" />
    </Svg>
);

export const IdCardIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect width="18" height="14" x="3" y="5" rx="2" />
        <Line x1="7" y1="10" x2="7" y2="10.01" />
        <Line x1="11" y1="10" x2="17" y2="10" />
        <Line x1="11" y1="14" x2="17" y2="14" />
    </Svg>
);
export const BriefcaseIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ color = 'white', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Line x1="12" y1="5" x2="12" y2="19" />
        <Line x1="5" y1="12" x2="19" y2="12" />
    </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ color = '#64748b', size = 18, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Circle cx="12" cy="12" r="10" />
        <Polyline points="12 6 12 12 16 14" />
    </Svg>
);

export const HomeIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </Svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <Line x1="16" y1="2" x2="16" y2="6" />
        <Line x1="8" y1="2" x2="8" y2="6" />
        <Line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <Polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
);

export const BuildingIcon: React.FC<IconProps> = ({ color = '#64748b', size = 20, strokeWidth = 2, style }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <Path d="M9 22v-4h6v4" />
        <Path d="M8 6h.01" />
        <Path d="M16 6h.01" />
        <Path d="M12 6h.01" />
        <Path d="M12 10h.01" />
        <Path d="M12 14h.01" />
        <Path d="M16 10h.01" />
        <Path d="M16 14h.01" />
        <Path d="M8 10h.01" />
        <Path d="M8 14h.01" />
    </Svg>
);
