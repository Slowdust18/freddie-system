'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, AlertCircle, MessageSquare, Filter, Download, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { formatDate, getRatingColor, getStatusBadgeColor } from '@/lib/utils';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  aiResponse?: string;
  status: 'responded' | 'escalated' | 'pending';
  timestamp: string;
}

interface OutletStats {
  totalReviews: number;
  avgRating: number;
  positiveReviews: number;
  negativeReviews: number;
}

interface ReviewResponse {
  id: number;
  customer_name: string;
  rating: number;
  text: string;
  ai_response?: string;
  status: 'responded' | 'escalated' | 'pending';
  timestamp: string;
}

interface OutletStatsResponse {
  totalReviews: number;
  avgRating: number;
  positiveReviews: number;
  negativeReviews: number;
}

export default function OutletDashboard() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<OutletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'responded' | 'escalated'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const outletId = localStorage.getItem('outletId');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!outletId) {
      setError('No outlet mapped to this user. Please contact support.');
      setLoading(false);
      return;
    }
    fetchDashboardData(outletId);
  }, [router]);

  const fetchDashboardData = async (outletId: string) => {
    try {
      setLoading(true);
      const [statsResponse, reviewsResponse] = await Promise.all([
        api.get<OutletStatsResponse>('/api/outlets/stats', {
          params: { outlet_id: outletId },
        }),
        api.get<ReviewResponse[]>('/api/reviews', {
          params: { outlet_id: outletId, limit: 200 },
        }),
      ]);

      const parsedReviews: Review[] = reviewsResponse.data.map((review) => ({
        id: review.id.toString(),
        customerName: review.customer_name,
        rating: review.rating,
        text: review.text,
        aiResponse: review.ai_response,
        status: review.status,
        timestamp: review.timestamp,
      }));

      setStats(statsResponse.data);
      setReviews(parsedReviews);
      setFilteredReviews(parsedReviews);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      const message = err?.response?.data?.detail || err?.message || 'Unable to load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = reviews;

    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter((review) => review.status === filter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter((review) => review.rating === ratingFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  }, [filter, ratingFilter, searchTerm, reviews]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  const handleExportReviews = () => {
    const csv = [
      ['Customer', 'Rating', 'Review', 'Status', 'AI Response', 'Date'],
      ...filteredReviews.map((r) => [
        r.customerName,
        r.rating,
        r.text,
        r.status,
        r.aiResponse || 'N/A',
        formatDate(r.timestamp),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{error}</p>
          <Button className="mt-4" onClick={() => {
            const outletId = localStorage.getItem('outletId');
            if (outletId) {
              fetchDashboardData(outletId);
            }
          }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Outlet Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                Total Reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Average Rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {stats?.avgRating.toFixed(1) || '0.0'}
                <Star className="w-5 h-5 ml-2 fill-yellow-500 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center">
                <ThumbsUp className="w-3 h-3 mr-1" />
                Positive Reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.positiveReviews || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats && stats.totalReviews > 0
                  ? Math.round((stats.positiveReviews / stats.totalReviews) * 100)
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Escalated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats?.negativeReviews || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Review Filters
                </CardTitle>
                <CardDescription>Search and filter your reviews</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportReviews}>
                <Download className="w-4 h-4 mr-2" />
                Export Reviews
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by customer name or review text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All ({reviews.length})
                </Button>
                <Button
                  variant={filter === 'responded' ? 'default' : 'outline'}
                  onClick={() => setFilter('responded')}
                  size="sm"
                >
                  Responded ({reviews.filter((r) => r.status === 'responded').length})
                </Button>
                <Button
                  variant={filter === 'escalated' ? 'default' : 'outline'}
                  onClick={() => setFilter('escalated')}
                  size="sm"
                >
                  Escalated ({reviews.filter((r) => r.status === 'escalated').length})
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4 items-center flex-wrap">
              <span className="text-sm font-medium flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Rating:
              </span>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={ratingFilter === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRatingFilter(ratingFilter === rating ? 'all' : rating)}
                >
                  {rating} ★ ({reviews.filter((r) => r.rating === rating).length})
                </Button>
              ))}
              {ratingFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRatingFilter('all')}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-semibold text-lg">No reviews found</p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-2 border-gray-300 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{review.customerName}</h4>
                        <p className="text-sm text-gray-600 font-medium">{formatDate(review.timestamp)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center ${getRatingColor(review.rating)}`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'fill-current' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <Badge className={getStatusBadgeColor(review.status)}>
                          {review.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-800 mb-4 font-medium leading-relaxed">{review.text}</p>
                    {review.aiResponse && (
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-600 p-4 rounded-lg shadow-sm">
                        <p className="text-sm font-bold text-blue-900 mb-2">
                          AI Response:
                        </p>
                        <p className="text-sm text-gray-900 font-medium">{review.aiResponse}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
