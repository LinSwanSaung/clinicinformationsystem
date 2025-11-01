import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Sparkles, RefreshCw, AlertCircle, Heart, PartyPopper } from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "../../services/api";

const TYPE_META = {
  "diagnosis-based": { label: "Tailored Care Plan", emoji: "\u{1FA7A}" },
  wellness: { label: "Wellness Boost", emoji: "\u{1F33C}" },
  nutrition: { label: "Nutrition Nuggets", emoji: "\u{1F957}" },
  movement: { label: "Move & Groove", emoji: "\u{1F3C3}\u200D\u2640\uFE0F" }
};

const FALLBACK_META = { label: "Health Highlights", emoji: "\u2728" };

const AIHealthBlog = ({ patientId }) => {
  const [healthAdvice, setHealthAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthAdvice = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await api.get(`/ai/health-advice/${patientId}`);

      if (!result?.success) {
        throw new Error(result?.message || "Failed to fetch health advice");
      }

      setHealthAdvice(result.data);
    } catch (err) {
      setError(err.message || "Unable to load health tips right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchHealthAdvice();
    }
  }, [patientId]);

  const handleRefresh = () => fetchHealthAdvice(true);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />
          <h2 className="text-xl font-bold">AI Health Assistant</h2>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Brewing personalized insights just for you {"\u2615"}
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-900 mb-2">We hit a snag</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!healthAdvice) {
    return null;
  }

  const meta = TYPE_META[healthAdvice.type] || FALLBACK_META;

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              AI Health Assistant
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                {meta.emoji} {meta.label}
              </span>
            </h2>
            {healthAdvice.type === "diagnosis-based" && healthAdvice.diagnosis && (
              <p className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                Based on your diagnosis:
                <span className="font-semibold">{healthAdvice.diagnosis}</span>
                {healthAdvice.diagnosedDate && (
                  <>
                    <span className="text-gray-400">{"\u2022"}</span>
                    <span className="text-gray-500">
                      noted {new Date(healthAdvice.diagnosedDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            )}
            {healthAdvice.type === "wellness" && (
              <p className="text-sm text-gray-600 flex items-center">
                <Heart className="h-4 w-4 mr-1 text-pink-500" />
                General Wellness Tips
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={refreshing}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-purple-100 space-y-4">
          <div className="flex items-start gap-3">
            <PartyPopper className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Here is your feel-good nudge for today:
              </p>
              <p className="text-sm text-gray-600">
                Sip some water, roll your shoulders back, and explore a few simple wins to brighten the day. {"\u{1F389}"}
              </p>
            </div>
          </div>

          <ReactMarkdown
            components={{
              h1: (props) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0" {...props} />,
              h2: (props) => <h2 className="text-base font-semibold text-gray-800 mb-2 mt-3" {...props} />,
              h3: (props) => <h3 className="text-sm font-semibold text-gray-700 mb-1 mt-2" {...props} />,
              p: (props) => <p className="text-sm text-gray-700 mb-2 leading-relaxed" {...props} />,
              ul: (props) => <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-2" {...props} />,
              ol: (props) => <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-2" {...props} />,
              li: (props) => <li className="ml-2" {...props} />,
              strong: (props) => <strong className="font-semibold text-gray-900" {...props} />,
              em: (props) => <em className="italic text-gray-600" {...props} />,
            }}
          >
            {healthAdvice.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800 leading-relaxed">
          <strong>{"\u26A0\uFE0F"} Friendly reminder:</strong> These nuggets are AI-generated for inspiration. Your care team knows you best, so always lean on their guidance for personalized medical advice. {"\u{1F49B}"}
        </p>
      </div>

      {healthAdvice.generatedAt && (
        <p className="text-xs text-gray-500 mt-3 text-right">
          Generated: {new Date(healthAdvice.generatedAt).toLocaleString()}
        </p>
      )}
    </Card>
  );
};

export default AIHealthBlog;
