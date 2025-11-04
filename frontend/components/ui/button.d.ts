import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button-variants";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<Omit<ButtonProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { Button };
