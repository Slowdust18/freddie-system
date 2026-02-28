'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">FREDDIE</h1>
            <p className="text-xs text-gray-400 tracking-wider">AI REVIEW AUTOMATION SYSTEM</p>
          </div>
          <Link href="/login">
            <Button
              size="lg"
              className="font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-blue-700"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-5xl font-bold tracking-tight sm:text-6xl text-white">
            Automate Your Google Reviews
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Enterprise-grade AI platform that syncs, analyzes, and responds to customer reviews automatically. 
            Boost your reputation with intelligent automation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-blue-700"
              >
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-semibold border border-blue-500/40 bg-black/80 text-white hover:bg-blue-500/10"
              >
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm font-medium text-gray-600">Auto-Response</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm font-medium text-gray-600">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">&lt;2min</div>
              <div className="text-sm font-medium text-gray-600">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">100+</div>
              <div className="text-sm font-medium text-gray-600">Active Outlets</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Powerful Features
          </h3>
          <p className="text-muted-foreground">Everything you need to manage your online reputation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Auto Review Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Automatically fetch and sync Google reviews daily. Never miss a customer review again.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">AI-Powered Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Generate personalized, contextual responses using advanced AI. Maintain your brand voice.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Monthly reports with NLP insights, keyword extraction, and sentiment analysis.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Smart Escalation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Low-rated reviews automatically escalate to managers. Quick resolution for unhappy customers.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Billing Guardrails</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Auto-pause on payment issues. 7/3/1 day alerts before expiry. Seamless subscription management.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Admin, Manager, and Bot roles with 2FA support. Secure enterprise-grade permissions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold tracking-tight mb-4">
            How It Works
          </h3>
          <p className="text-gray-600">Simple 5-step process to automate your reviews</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-semibold text-base mb-2 text-gray-900">Onboard</h4>
            <p className="text-gray-600 text-sm">Register outlet and connect API</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-semibold text-base mb-2 text-gray-900">Sync</h4>
            <p className="text-gray-600 text-sm">Daily automatic synchronization</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="font-semibold text-base mb-2 text-gray-900">AI Process</h4>
            <p className="text-gray-600 text-sm">Generate intelligent responses</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h4 className="font-semibold text-base mb-2 text-gray-900">Auto-Reply</h4>
            <p className="text-gray-600 text-sm">Post responses automatically</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              5
            </div>
            <h4 className="font-semibold text-base mb-2 text-gray-900">Analyze</h4>
            <p className="text-gray-600 text-sm">Monthly performance reports</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Card className="bg-muted/50">
          <CardContent className="py-16 space-y-6">
            <h3 className="text-3xl font-bold tracking-tight">
              Ready to Automate Your Reviews?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join 100+ businesses already using AI to manage their online reputation
            </p>
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-500 hover:to-blue-700"
              >
                Start Free Trial
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 AI Review Automation Platform. Enterprise-Grade Review Management.
          </p>
        </div>
      </footer>
    </div>
  );
}
