export declare const buttonVariants: (props?: {
    variant?: "link" | "destructive" | "outline" | "ghost" | "default" | "secondary";
    size?: "sm" | "default" | "icon" | "lg";
} & import("class-variance-authority/types").ClassProp) => string;
export type ButtonVariantConfig = Parameters<typeof buttonVariants>[0];
