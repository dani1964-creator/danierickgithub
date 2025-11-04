interface LogoUploadProps {
    logoUrl: string;
    logoSize?: number;
    onLogoChange: (url: string) => void;
    onLogoSizeChange?: (size: number) => void;
}
declare const LogoUpload: ({ logoUrl, logoSize, onLogoChange, onLogoSizeChange }: LogoUploadProps) => import("react/jsx-runtime").JSX.Element;
export default LogoUpload;
