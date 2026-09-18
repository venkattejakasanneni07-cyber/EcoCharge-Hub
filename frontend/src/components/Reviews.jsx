import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';

const Reviews = ({ stationId, stationName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('stationId', '==', stationId)
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        let total = 0;
        querySnapshot.forEach((doc) => {
          const review = { id: doc.id, ...doc.data() };
          data.push(review);
          total += review.rating;
          
          // Check if current user has reviewed
          if (user && review.userId === user.uid) {
            setHasReviewed(true);
            setUserRating(review.rating);
            setUserReview(review.comment || '');
          }
        });
        setReviews(data);
        setTotalReviews(data.length);
        setAverageRating(data.length > 0 ? total / data.length : 0);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
      setLoading(false);
    };
    fetchReviews();
  }, [stationId, user]);

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to leave a review.');
      return;
    }
    if (userRating === 0) {
      alert('Please select a rating.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        stationId: stationId,
        stationName: stationName,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        rating: userRating,
        comment: userReview,
        createdAt: serverTimestamp()
      });

      // Update station average rating
      const stationRef = doc(db, 'stations', stationId);
      await updateDoc(stationRef, {
        averageRating: (averageRating * totalReviews + userRating) / (totalReviews + 1),
        totalReviews: totalReviews + 1
      });

      alert('✅ Review submitted successfully!');
      window.location.reload();
    } catch (error) {
      alert('❌ Error submitting review: ' + error.message);
    }
    setSubmitting(false);
  };

  // Render stars
  const renderStars = (rating, interactive = false, onHover = null, onClick = null) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar 
            key={i} 
            style={{ 
              color: '#f59e0b', 
              cursor: interactive ? 'pointer' : 'default', 
              fontSize: interactive ? '28px' : '16px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={() => interactive && onHover && onHover(i)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            onClick={() => interactive && onClick && onClick(i)}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt 
            key={i} 
            style={{ 
              color: '#f59e0b', 
              cursor: interactive ? 'pointer' : 'default', 
              fontSize: interactive ? '28px' : '16px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={() => interactive && onHover && onHover(i)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            onClick={() => interactive && onClick && onClick(i)}
          />
        );
      } else {
        stars.push(
          <FaRegStar 
            key={i} 
            style={{ 
              color: '#f59e0b', 
              cursor: interactive ? 'pointer' : 'default', 
              fontSize: interactive ? '28px' : '16px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={() => interactive && onHover && onHover(i)}
            onMouseLeave={() => interactive && onHover && onHover(0)}
            onClick={() => interactive && onClick && onClick(i)}
          />
        );
      }
    }
    return stars;
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h3>⭐ Reviews & Ratings</h3>
        <div className="rating-summary">
          <div className="average-rating">
            <span className="big-rating">{averageRating.toFixed(1)}</span>
            <div className="stars-display">{renderStars(averageRating)}</div>
            <span className="review-count">({totalReviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* Review Form - Only show if user is logged in and hasn't reviewed */}
      {user && !hasReviewed && (
        <div className="review-form">
          <h4>✍️ Write a Review</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="rating-input">
              <label>Your Rating:</label>
              <div className="stars-input">
                {renderStars(
                  hoverRating || userRating, 
                  true, 
                  setHoverRating, 
                  setUserRating
                )}
                <span className="rating-label">
                  {userRating > 0 ? `${userRating} star${userRating > 1 ? 's' : ''}` : 'Tap a star to rate'}
                </span>
              </div>
            </div>
            <div className="comment-input">
              <textarea
                placeholder="Share your experience with this charging station..."
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                rows="4"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Already Reviewed Message */}
      {user && hasReviewed && (
        <div className="already-reviewed">
          <p>✅ You have already reviewed this station.</p>
          <div className="your-review">
            <div className="your-rating">{renderStars(userRating)}</div>
            {userReview && <p className="your-comment">"{userReview}"</p>}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review! 🌟</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <strong>{review.userName}</strong>
                <div className="review-stars">{renderStars(review.rating)}</div>
                <span className="review-date">
                  {review.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) || 'N/A'}
                </span>
              </div>
              {review.comment && <p className="review-comment">"{review.comment}"</p>}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .reviews-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin-top: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
          border: 1px solid #e9ecef;
        }
        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e9ecef;
          transition: border-color 0.3s ease;
          flex-wrap: wrap;
          gap: 10px;
        }
        .reviews-header h3 {
          color: #1a1a2e;
          transition: color 0.3s ease;
          font-size: 20px;
        }
        .rating-summary {
          display: flex;
          align-items: center;
        }
        .average-rating {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .big-rating {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a2e;
          transition: color 0.3s ease;
        }
        .stars-display {
          display: flex;
          gap: 2px;
        }
        .stars-display svg {
          color: #f59e0b;
        }
        .review-count {
          color: #6c757d;
          font-size: 14px;
          transition: color 0.3s ease;
        }
        .review-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          transition: background 0.3s ease;
        }
        .review-form h4 {
          color: #1a1a2e;
          margin-bottom: 15px;
          transition: color 0.3s ease;
        }
        .rating-input {
          margin-bottom: 15px;
        }
        .rating-input label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1a1a2e;
          transition: color 0.3s ease;
        }
        .stars-input {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stars-input svg {
          color: #f59e0b;
          transition: transform 0.2s;
        }
        .stars-input svg:hover {
          transform: scale(1.2);
        }
        .rating-label {
          font-size: 14px;
          color: #6c757d;
          transition: color 0.3s ease;
        }
        .comment-input textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          font-family: inherit;
          background: white;
          color: #1a1a2e;
          transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .comment-input textarea:focus {
          border-color: #2e7d32;
          outline: none;
        }
        .comment-input textarea::placeholder {
          color: #6c757d;
        }
        .already-reviewed {
          background: #d4edda;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          transition: background 0.3s ease;
        }
        .already-reviewed p {
          color: #155724;
          transition: color 0.3s ease;
          margin: 0;
        }
        .your-review {
          margin-top: 10px;
        }
        .your-rating {
          display: flex;
          gap: 2px;
        }
        .your-rating svg {
          color: #f59e0b;
        }
        .your-comment {
          color: #155724;
          font-style: italic;
          margin-top: 5px;
          transition: color 0.3s ease;
        }
        .reviews-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .no-reviews {
          color: #6c757d;
          text-align: center;
          padding: 20px;
          transition: color 0.3s ease;
        }
        .review-item {
          padding: 15px 0;
          border-bottom: 1px solid #e9ecef;
          transition: border-color 0.3s ease;
        }
        .review-item:last-child {
          border-bottom: none;
        }
        .review-header {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        .review-header strong {
          color: #1a1a2e;
          transition: color 0.3s ease;
        }
        .review-stars {
          display: flex;
          gap: 2px;
        }
        .review-stars svg {
          color: #f59e0b;
        }
        .review-date {
          color: #6c757d;
          font-size: 12px;
          margin-left: auto;
          transition: color 0.3s ease;
        }
        .review-comment {
          color: #333;
          margin-top: 8px;
          padding-left: 5px;
          transition: color 0.3s ease;
        }
        @media (max-width: 768px) {
          .reviews-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .review-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          .review-date {
            margin-left: 0;
          }
          .average-rating {
            gap: 5px;
          }
          .big-rating {
            font-size: 24px;
          }
        }
        @media (max-width: 480px) {
          .reviews-section {
            padding: 15px;
          }
          .stars-input svg {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Reviews;