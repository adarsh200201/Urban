import React, { useState } from 'react';
import { FaStar, FaRegStar, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * Reusable Rating Modal component for both driver and user ratings
 * Centralized component to avoid code duplication between user and driver interfaces
 */
const RatingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  recipientName, 
  recipientType,
  bookingId
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setHover(0);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      // Must provide a rating
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        bookingId,
        rating,
        comment
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      // Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Rate your {recipientType === 'driver' ? 'Driver' : 'Passenger'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              How was your experience with {recipientName}?
            </p>
            
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                
                return (
                  <button
                    type="button"
                    key={ratingValue}
                    className={`text-3xl mx-1 focus:outline-none ${
                      ratingValue <= (hover || rating) 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                    onClick={() => setRating(ratingValue)}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                  >
                    {ratingValue <= (hover || rating) ? <FaStar /> : <FaRegStar />}
                  </button>
                );
              })}
            </div>
            
            <div className="rating-text text-center mb-4">
              {rating === 1 && <span>Poor</span>}
              {rating === 2 && <span>Fair</span>}
              {rating === 3 && <span>Good</span>}
              {rating === 4 && <span>Very Good</span>}
              {rating === 5 && <span>Excellent</span>}
            </div>
          </div>
          
          <div className="mb-4">
            <label 
              htmlFor="comment" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Additional Comments (Optional)
            </label>
            <textarea
              id="comment"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share your experience with this ${
                recipientType === 'driver' ? 'driver' : 'passenger'
              }`}
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                rating === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

RatingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  recipientName: PropTypes.string.isRequired,
  recipientType: PropTypes.oneOf(['driver', 'user']).isRequired,
  bookingId: PropTypes.string.isRequired
};

export default RatingModal;
