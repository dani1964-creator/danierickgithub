import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
declare const AlertDialog: import("react").FC<AlertDialogPrimitive.AlertDialogProps>;
declare const AlertDialogTrigger: import("react").ForwardRefExoticComponent<AlertDialogPrimitive.AlertDialogTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
declare const AlertDialogPortal: import("react").FC<AlertDialogPrimitive.AlertDialogPortalProps>;
declare const AlertDialogOverlay: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogOverlayProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AlertDialogContent: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const AlertDialogHeader: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const AlertDialogFooter: {
    ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const AlertDialogTitle: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogTitleProps & import("react").RefAttributes<HTMLHeadingElement>, "ref"> & React.RefAttributes<HTMLHeadingElement>>;
declare const AlertDialogDescription: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogDescriptionProps & import("react").RefAttributes<HTMLParagraphElement>, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
declare const AlertDialogAction: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogActionProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const AlertDialogCancel: React.ForwardRefExoticComponent<Omit<AlertDialogPrimitive.AlertDialogCancelProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, };
