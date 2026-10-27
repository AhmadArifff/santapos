/**
 * Ingredient Calculator Utility
 * Handles calculations for recipe ingredients and stock availability
 */

/**
 * Calculate ingredients needed for a specific number of portions
 * @param {Array} ingredients - Recipe ingredients from product
 * @param {number} portions - Number of portions to make
 * @returns {Array} Ingredients with calculated quantities for the specified portions
 */
export const calculateIngredientsForPortions = (ingredients, portions) => {
  if (!ingredients || !Array.isArray(ingredients)) return [];
  
  return ingredients.map(ing => ({
    ...ing,
    required_qty: Number(ing.qty) * portions, // qty per portion × number of portions
    required_qty_formatted: (Number(ing.qty) * portions).toFixed(4).replace(/\.?0+$/, ''), // Remove trailing zeros
  }));
};

/**
 * Calculate how many portions can be made from available ingredients
 * @param {Array} ingredients - Recipe ingredients
 * @param {Object} ingredientStockMap - Map of stock_item_id -> { available_qty, unit }
 * @returns {number} Maximum portions that can be made
 */
export const calculateMaxPortions = (ingredients, ingredientStockMap = {}) => {
  if (!ingredients || ingredients.length === 0) return 0;
  
  const maxPortionsPerIngredient = ingredients.map(ing => {
    const available = Number(ingredientStockMap[ing.stock_item_id]?.available_qty || 0);
    const requiredPerPortion = Number(ing.qty || 1);
    
    return requiredPerPortion > 0 
      ? Math.floor(available / requiredPerPortion)
      : 0;
  });
  
  // Return the minimum (bottleneck ingredient determines max portions)
  return Math.min(...maxPortionsPerIngredient);
};

/**
 * Get detailed availability breakdown for a product
 * @param {Object} product - Product with ingredients
 * @param {Object} selectedUserStock - User's stock allocation with ingredients
 * @returns {Object} Detailed availability breakdown
 */
export const getAvailabilityBreakdown = (product, selectedUserStock) => {
  if (!product || !selectedUserStock || !product.ingredients) {
    return {
      ingredients_total: 0,
      current_portions: 0,
      remaining_portions: 0,
      ingredient_breakdown: [],
    };
  }

  const ingredientStockMap = (selectedUserStock.ingredients || []).reduce((acc, ing) => {
    acc[ing.stock_item_id] = ing;
    return acc;
  }, {});

  const canMake = calculateMaxPortions(product.ingredients, ingredientStockMap);

  const ingredientBreakdown = product.ingredients.map(ing => {
    const available = Number(ingredientStockMap[ing.stock_item_id]?.available_qty || 0);
    const requiredPerPortion = Number(ing.qty || 1);
    const remainingAfterMaking = available - (requiredPerPortion * canMake);

    return {
      name: ing.ingredient_name,
      unit: ing.unit,
      available: available,
      required_per_portion: requiredPerPortion,
      total_required_for_making: requiredPerPortion * canMake,
      remaining_after: Math.max(0, remainingAfterMaking),
      status: available === 0 ? 'empty' : remainingAfterMaking < requiredPerPortion ? 'warning' : 'ok',
    };
  });

  return {
    ingredients_total: product.ingredients.length,
    current_portions: canMake,
    remaining_portions: 0, // Could be calculated differently if needed
    ingredient_breakdown: ingredientBreakdown,
  };
};

/**
 * Get ingredient status color based on availability
 * @param {number} available - Available quantity
 * @param {number} required - Required quantity per portion
 * @param {number} portions - Number of portions to make
 * @returns {string} CSS color class name
 */
export const getIngredientStatusColor = (available, required, portions) => {
  if (available === 0) return 'text-red-500';
  
  const canMakeWithThis = Math.floor(available / required);
  if (canMakeWithThis <= portions) return 'text-yellow-500';
  
  return 'text-green-500';
};

/**
 * Format quantity display with unit
 * @param {number} qty - Quantity
 * @param {string} unit - Unit string
 * @returns {string} Formatted quantity with unit
 */
export const formatQuantityDisplay = (qty, unit) => {
  if (!qty && qty !== 0) return '-';
  
  // For whole numbers, don't show decimal
  const formatted = Number.isInteger(qty) 
    ? qty.toString() 
    : qty.toFixed(4).replace(/\.?0+$/, '');
  
  return `${formatted} ${unit || 'pcs'}`.trim();
};
