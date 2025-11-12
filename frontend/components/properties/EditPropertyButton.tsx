import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditPropertyDialog from './EditPropertyDialog';

interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  property_type: string;
  transaction_type: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  parking_spaces: number | null;
  is_featured: boolean;
  features: string[] | null;
  images: string[] | null;
  property_code: string | null;
  status: string | null;
  realtor_id?: string | null;
  views_count?: number;
  main_image_url?: string;
}

interface EditPropertyButtonProps {
  property: Property;
  onPropertyUpdated: () => void;
}

const EditPropertyButton = ({ property, onPropertyUpdated }: EditPropertyButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="hover:bg-primary/10 hover:text-primary hover:border-primary/20"
      >
        <Edit className="h-3 w-3" />
      </Button>
      
      <EditPropertyDialog
        property={property}
        open={open}
        onOpenChange={setOpen}
        onPropertyUpdated={onPropertyUpdated}
      />
    </>
  );
};

export default EditPropertyButton;