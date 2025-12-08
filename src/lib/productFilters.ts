import { supabase, Product } from './supabase';

// Filter options interface
export interface ProductFilters {
  category?: string;
  material?: string;
  type?: string;
  pattern?: string;
  fit?: string;
  status?: 'draft' | 'published' | 'archived' | 'stockout';
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

// Get unique values for filter dropdowns
export async function getFilterOptions() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('material, type, pattern, fit, category')
      .eq('status', 'published');

    if (error) throw error;

    // Extract unique values
    const materials = [...new Set(data.map(p => p.material).filter(Boolean))];
    const types = [...new Set(data.map(p => p.type).filter(Boolean))];
    const patterns = [...new Set(data.map(p => p.pattern).filter(Boolean))];
    const fits = [...new Set(data.map(p => p.fit).filter(Boolean))];
    const categories = [...new Set(data.map(p => p.category).filter(Boolean))];

    return {
      materials: materials.sort(),
      types: types.sort(),
      patterns: patterns.sort(),
      fits: fits.sort(),
      categories: categories.sort(),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      materials: [],
      types: [],
      patterns: [],
      fits: [],
      categories: [],
    };
  }
}

// Search and filter products
export async function searchProducts(filters: ProductFilters = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'published'); // Only show published products

    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply material filter
    if (filters.material) {
      query = query.eq('material', filters.material);
    }

    // Apply type filter
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Apply pattern filter
    if (filters.pattern) {
      query = query.eq('pattern', filters.pattern);
    }

    // Apply fit filter
    if (filters.fit) {
      query = query.eq('fit', filters.fit);
    }

    // Apply price range filter
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    // Apply search query (searches in name and description)
    if (filters.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data as Product[];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Get products by category
export async function getProductsByCategory(category: string) {
  return searchProducts({ category, status: 'published' });
}

// Get products by material
export async function getProductsByMaterial(material: string) {
  return searchProducts({ material, status: 'published' });
}

// Get products by type
export async function getProductsByType(type: string) {
  return searchProducts({ type, status: 'published' });
}

// Get products by pattern
export async function getProductsByPattern(pattern: string) {
  return searchProducts({ pattern, status: 'published' });
}

// Get products by fit
export async function getProductsByFit(fit: string) {
  return searchProducts({ fit, status: 'published' });
}

