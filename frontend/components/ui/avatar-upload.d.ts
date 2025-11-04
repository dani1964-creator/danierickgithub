interface AvatarUploadProps {
    currentUrl?: string | null;
    onUploadComplete: (url: string) => void;
    bucketName?: string;
    folder?: string;
    label?: string;
    fallbackText?: string;
}
export declare const AvatarUpload: ({ currentUrl, onUploadComplete, bucketName, folder, label, fallbackText }: AvatarUploadProps) => import("react/jsx-runtime").JSX.Element;
export {};
