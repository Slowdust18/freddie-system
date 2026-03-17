'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MessageSquare, LogOut, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Review {
  id: number;
  customer_name: string;
  rating: number;
  text: string;
  ai_response: string | null;
  status: string;
  timestamp: string;
}

export default function OutletDashboard() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const outletId = localStorage.getItem('outletId');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'user') {
      router.push('/login');
      return;
    }

    if (!outletId) {
      setError('No outlet mapped to this account. Please contact admin.');
      setLoading(false);
      return;
    }

    fetchReviews(outletId);
  }, [router]);

  const fetchReviews = async (outletId: string) => {
    try {
      setLoading(true);
      // Fetch the latest 50 reviews for this specific outlet
      const response = await api.get<Review[]>('/api/outlet/reviews', {
        params: { outlet_id: outletId },
      });
      setReviews(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setError(err?.response?.data?.detail || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Calculate simple stats from the fetched feed
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading your reviews...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">FREDDIE</h1>
          <p className="text-xs text-gray-400">Client Portal</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2 border-none">
                  <CardDescription className="text-gray-400 font-medium flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> Recent Reviews Processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{totalReviews}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-2 border-none">
                  <CardDescription className="text-gray-400 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-2" /> Average Rating (Recent)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white flex items-center">
                    {avgRating} <Star className="w-6 h-6 ml-2 fill-yellow-500 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Feed */}
            <h2 className="text-2xl font-bold mb-4">Latest Interactions</h2>
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800 text-center py-12">
                  <CardContent>
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium text-gray-400">Freddie is monitoring your Google Business Profile.</p>
                    <p className="text-sm text-gray-500">New reviews and AI responses will appear here automatically.</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-white">{review.customer_name}</h4>
                          <p className="text-sm text-gray-500">{review.timestamp ? formatDate(review.timestamp) : 'Just now'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-700'}`} />
                            ))}
                          </div>
                          <Badge className={review.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                            {review.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-6 italic">"{review.text}"</p>
                      
                      {review.ai_response && (
                        <div className="bg-black border border-gray-800 rounded-lg p-4 flex gap-4">
                          <div className="mt-1">
                            <Bot className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-wider">Freddie's Reply</p>
                            <p className="text-sm text-gray-300 leading-relaxed">{review.ai_response}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}