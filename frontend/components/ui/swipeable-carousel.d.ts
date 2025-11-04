import * as React from "react";
interface SwipeableCarouselProps {
    children: React.ReactNode[];
    className?: string;
    autoplay?: boolean;
    autoplayDelay?: number;
}
export declare function SwipeableCarousel({ children, className, autoplay, autoplayDelay }: SwipeableCarouselProps): import("react/jsx-runtime").JSX.Element;
export {};
