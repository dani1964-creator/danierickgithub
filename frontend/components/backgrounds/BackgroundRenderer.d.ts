import React from 'react';
interface BackgroundRendererProps {
    style: string;
    color1: string;
    color2: string;
    color3?: string;
    className?: string;
    children?: React.ReactNode;
}
declare const BackgroundRenderer: ({ style, color1, color2, color3, className, children }: BackgroundRendererProps) => import("react/jsx-runtime").JSX.Element;
export default BackgroundRenderer;
