/**
 * Utility functions for calculating cab prices dynamically based on distance and cab parameters
 */

/**
 * Calculate the price for a cab based on distance and cab parameters
 * @param {Object} cab - The cab object with pricing parameters
 * @param {number} distance - The distance in kilometers
 * @returns {number} - The calculated price (rounded to nearest integer)
 */
export const calculateCabPrice = (cab, distance) => {
  // If this is a fixed route cab, return the fixed price
  if (cab.isFixedRoute) return cab.basePrice || cab.price || 0;
  
  // If there's no distance information, return the base price
  if (!distance) return cab.baseKmPrice || 0;
  
  // Get parameters from cab object with fallbacks to prevent errors
  const baseKmPrice = cab.baseKmPrice || 0;
  const extraFarePerKm = cab.extraFarePerKm || 0;
  const includedKm = cab.includedKm || 0;
  
  // Calculate extra distance beyond included kilometers
  const extraDistance = Math.max(0, distance - includedKm);
  
  // FIXED: Calculate price properly based on per-kilometer rate
  // For included kilometers, use the base rate
  // For any extra kilometers, apply the extra fare rate
  let price = 0;
  
  // Apply base price to included kilometers (or total distance if less than included)
  const coveredDistance = Math.min(distance, includedKm);
  price = baseKmPrice * coveredDistance;
  
  // Only add extra fare if we've exceeded the included kilometers
  if (extraDistance > 0) {
    price += (extraDistance * extraFarePerKm);
  }
  
  // Log calculation details (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Price calculation for ${cab.name}:
- Total Distance: ${distance}km
- Included Kilometers: ${includedKm}km
- Covered by Base Rate: ${coveredDistance}km
- Extra Distance: ${extraDistance}km
- Base Rate: ₹${baseKmPrice}/km
- Base Distance Cost: ${coveredDistance} × ${baseKmPrice} = ₹${coveredDistance * baseKmPrice}
- Extra Fare Rate: ₹${extraFarePerKm}/km
- Extra Distance Cost: ${extraDistance} × ${extraFarePerKm} = ₹${extraDistance * extraFarePerKm}
- Total Price: ₹${price}`);
  }
  
  // Round to nearest integer
  return Math.round(price);
};

/**
 * Calculate taxes and fees for a booking
 * @param {number} baseAmount - The base amount for the booking
 * @param {number} taxRate - The tax rate (default: 0.05 or 5%)
 * @returns {number} - The calculated tax amount (rounded to nearest integer)
 */
export const calculateTaxesAndFees = (baseAmount, taxRate = 0.05) => {
  return Math.round(baseAmount * taxRate);
};

/**
 * Calculate the total amount for a booking including taxes and fees
 * @param {number} baseAmount - The base amount for the booking
 * @param {number} taxRate - The tax rate (default: 0.05 or 5%)
 * @returns {number} - The total amount including taxes (rounded to nearest integer)
 */
export const calculateTotalAmount = (baseAmount, taxRate = 0.05) => {
  return Math.round(baseAmount * (1 + taxRate));
};
