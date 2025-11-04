interface BackgroundStyleSelectorProps {
    selectedStyle: string;
    color1: string;
    color2: string;
    color3: string;
    onStyleChange: (style: string) => void;
    onColorChange: (colorIndex: 1 | 2 | 3, color: string) => void;
}
declare const BackgroundStyleSelector: ({ selectedStyle, color1, color2, color3, onStyleChange, onColorChange }: BackgroundStyleSelectorProps) => import("react/jsx-runtime").JSX.Element;
export default BackgroundStyleSelector;
