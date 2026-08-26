import { createClient } from '@/lib/supabase/server';
import ProductPageContent from './content';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('products')
      .select('name, description')
      .eq('id', id)
      .single();

    if (data) {
      return {
        title: `${data.name} - Drapey`,
        description: data.description || `Shop ${data.name} at Drapey. Clean silhouettes and calm tones.`,
      };
    }
  } catch {
    // fallback
  }
  return {
    title: 'Product - Drapey',
    description: 'View product details at Drapey.',
  };
}

export default function ProductPage() {
  return <ProductPageContent />;
}
