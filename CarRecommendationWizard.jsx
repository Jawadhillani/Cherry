'use client';
import { useState, useEffect } from 'react';
import {
  ChevronRight,
  Car,
  Check,
  ArrowRight,
  ThumbsUp,
  MessageSquare,
  ArrowLeft,
  X,
} from 'lucide-react';
import CarIllustration from './CarIllustration';

/**
 * Car Recommendation Wizard Component
 *
 * A guided questionnaire that helps users find their ideal car by answering a series
 * of questions. The questions adapt based on previous answers and use the data to
 * recommend the perfect vehicle from the database.
 */
const CarRecommendationWizard = ({
  onClose,
  onComplete,
  supabase,
  availableCars = [],
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [animation, setAnimation] = useState('slide-in');
  const [loading, setLoading] = useState(false);

  // Question bank
  const questions = [
    {
      id: 'budget',
      question: 'What is your budget range?',
      options: [
        { value: 'under_20k', label: 'Under $20,000' },
        { value: 'twenty_to_thirty', label: '$20,000 - $30,000' },
        { value: 'thirty_to_forty', label: '$30,000 - $40,000' },
        { value: 'forty_to_fifty', label: '$40,000 - $50,000' },
        { value: 'over_50k', label: 'Over $50,000' }
      ]
    },
    {
      id: 'body_type',
      question: 'What type of vehicle are you looking for?',
      options: [
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV' },
        { value: 'truck', label: 'Truck' },
        { value: 'coupe', label: 'Coupe' },
        { value: 'van', label: 'Van' }
      ]
    },
    {
      id: 'primary_use',
      question: 'What will be the primary use of your vehicle?',
      options: [
        { value: 'daily_commute', label: 'Daily Commute' },
        { value: 'family', label: 'Family Vehicle' },
        { value: 'luxury', label: 'Luxury/Comfort' },
        { value: 'performance', label: 'Performance/Sport' },
        { value: 'utility', label: 'Utility/Work' }
      ]
    },
    {
      id: 'fuel_preference',
      question: 'What is your preferred fuel type?',
      options: [
        { value: 'gas', label: 'Gasoline' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'electric', label: 'Electric' },
        { value: 'diesel', label: 'Diesel' }
      ]
    },
    {
      id: 'features',
      question: 'Which features are most important to you?',
      options: [
        { value: 'safety', label: 'Safety Features' },
        { value: 'tech', label: 'Technology' },
        { value: 'comfort', label: 'Comfort' },
        { value: 'performance', label: 'Performance' },
        { value: 'efficiency', label: 'Fuel Efficiency' }
      ],
      multiple: true
    }
  ];

  // The wizard will dynamically select which questions to ask based on previous answers
  const determineQuestionSequence = () => {
    // Start with essential questions
    let sequence = ['budget', 'body_type', 'primary_use'];

    // Add features question if budget is high or primary use is luxury
    if (answers.budget === 'over_50k' || answers.primary_use === 'luxury') {
      sequence.push('features');
    }

    // Always add fuel preference at the end
    sequence.push('fuel_preference');

    // Deduplicate in case there are any repeats
    return [...new Set(sequence)];
  };

  // Get current question based on the sequence and step
  const getCurrentQuestion = () => {
    const sequence = determineQuestionSequence();
    if (currentStep >= sequence.length) return null;

    const questionId = sequence[currentStep];
    return questions.find((q) => q.id === questionId) || null;
  };

  // Get total number of questions in sequence
  const getTotalQuestions = () => {
    return determineQuestionSequence().length;
  };

  // Handle answer selection
  const handleAnswer = (questionId, answer) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Animate out
    setAnimation('slide-out');

    setTimeout(() => {
      // Update answers
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));

      // Move to next question or complete if we're at the end
      const sequence = determineQuestionSequence();
      if (currentStep >= sequence.length - 1) {
        // We're at the last question, start recommendation process
        setIsCompleting(true);
        setLoading(true);
        findRecommendation();
      } else {
        setCurrentStep(currentStep + 1);
        setAnimation('slide-in');
      }
    }, 300);
  };

  // Go back to previous question
  const handleBack = () => {
    if (currentStep === 0) return;

    setAnimation('slide-out-reverse');

    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setAnimation('slide-in-reverse');
    }, 300);
  };

  // Helper function to get car details from AI
  const getCarDetailsFromAI = async (carName) => {
    if (!carName || typeof carName !== 'string') {
      console.warn('Invalid car name provided to getCarDetailsFromAI:', carName);
      return null;
    }

    // In a real scenario, this function would call an AI model
    // with the car name and ask for details like price, body type, description, etc.

    // --- SIMULATED AI RESPONSE (Replace with actual AI call) ---
    console.log(`Simulating AI lookup for: ${carName}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const lowerCaseName = carName.toLowerCase();

    // Default car data structure
    const defaultCarData = {
      name: carName,
      manufacturer: carName.split(' ')[0],
      model: carName.split(' ').slice(1).join(' '),
      body_type: 'sedan',
      price: 25000,
      primary_use: 'daily_commute',
      description: 'A reliable vehicle for everyday use.',
      features: ['Standard features', 'Good value'],
      year: 2023
    };

    if (lowerCaseName.includes('dodge avenger')) {
      return {
        name: 'Dodge Avenger',
        manufacturer: 'Dodge',
        model: 'Avenger',
        body_type: 'sedan',
        price: 15000,
        primary_use: 'daily_commute',
        description: 'A reliable sedan for everyday driving.',
        features: ['Good fuel economy', 'Comfortable ride'],
        year: 2001
      };
    } else if (lowerCaseName.includes('bmw m3')) {
      return {
        name: 'BMW M3',
        manufacturer: 'BMW',
        model: 'M3',
        body_type: 'coupe',
        price: 70000,
        primary_use: 'performance',
        description: 'A high-performance sports coupe with excellent handling and power.',
        features: ['Sport suspension', 'Powerful engine', 'Luxury interior'],
        year: 2023
      };
    } else if (lowerCaseName.includes('toyota rav4')) {
      return {
        name: 'Toyota RAV4',
        manufacturer: 'Toyota',
        model: 'RAV4',
        body_type: 'suv',
        price: 35000,
        primary_use: 'family',
        description: 'A versatile and reliable SUV perfect for families and adventures.',
        features: ['Spacious interior', 'Safety features', 'Good fuel efficiency'],
        year: 2024
      };
    }

    // If no specific match is found, return a default car with the provided name
    return {
      ...defaultCarData,
      name: carName,
      manufacturer: carName.split(' ')[0],
      model: carName.split(' ').slice(1).join(' ')
    };
  };

  // Find the best car recommendation based on user answers
  const findRecommendation = async () => {
    try {
      console.log('--- BEGINNING RECOMMENDATION PROCESS ---');
      console.log('User Answers:', answers);

      // Ensure we have cars to check
      if (!availableCars || availableCars.length === 0) {
        console.error('No cars available in the database');
        throw new Error('No cars available in the database');
      }

      console.log('Available cars:', availableCars);

      let potentialRecommendations = [];

      // Iterate through the cars
      for (const carEntry of availableCars) {
        // Skip if no name or if name is not a string
        if (!carEntry?.name || typeof carEntry.name !== 'string') {
          console.warn('Skipping car entry with invalid name:', carEntry);
          continue;
        }

        const carName = carEntry.name.toLowerCase();
        console.log('Processing car:', carName);

        // Get car details
        const carDetails = await getCarDetailsFromAI(carName);

        if (carDetails) {
          console.log(`Found details for: ${carName}`, carDetails);

          let matchScore = 0;
          let totalCriteria = 0;
          let partialMatches = 0;

          // Check budget (if provided and if AI knows the price)
          if (answers.budget && carDetails.price) {
            totalCriteria++;
            const budgetRanges = {
              'under_20k': [0, 20000],
              'twenty_to_thirty': [20000, 30000],
              'thirty_to_forty': [30000, 40000],
              'forty_to_fifty': [40000, 50000],
              'over_50k': [50000, Infinity]
            };
            const [minPrice, maxPrice] = budgetRanges[answers.budget];
            if (carDetails.price >= minPrice && carDetails.price <= maxPrice) {
              matchScore += 1;
              console.log(`  ✓ Budget match: ${carDetails.price} is in ${answers.budget}`);
            } else {
              // Check if price is within 20% of the range
              const range = maxPrice - minPrice;
              const tolerance = range * 0.2;
              if (carDetails.price >= (minPrice - tolerance) && carDetails.price <= (maxPrice + tolerance)) {
                partialMatches += 0.5;
                console.log(`  ~ Budget partial match: ${carDetails.price} is near ${answers.budget}`);
              } else {
                console.log(`  ✗ Budget mismatch: ${carDetails.price} not in ${answers.budget}`);
              }
            }
          }

          // Check body type (if provided and if AI knows the body type)
          if (answers.body_type && carDetails.body_type) {
            totalCriteria++;
            if (carDetails.body_type.toLowerCase() === answers.body_type.toLowerCase()) {
              matchScore += 1;
              console.log(`  ✓ Body type match: ${carDetails.body_type}`);
            } else {
              // Check for similar body types
              const similarTypes = {
                'sedan': ['coupe', 'hatchback'],
                'suv': ['crossover', 'wagon'],
                'truck': ['pickup', 'van'],
                'coupe': ['sedan', 'sport'],
                'van': ['minivan', 'suv']
              };
              
              const similarTo = similarTypes[answers.body_type] || [];
              if (similarTo.includes(carDetails.body_type.toLowerCase())) {
                partialMatches += 0.5;
                console.log(`  ~ Body type similar: ${carDetails.body_type} is similar to ${answers.body_type}`);
              } else {
                console.log(`  ✗ Body type mismatch: ${carDetails.body_type} vs ${answers.body_type}`);
              }
            }
          }

          // Check primary use (if provided and if AI knows about it)
          if (answers.primary_use && carDetails.description) {
            totalCriteria++;
            const useKeywords = answers.primary_use.toLowerCase().split('_').join(' ');
            if (carDetails.description.toLowerCase().includes(useKeywords)) {
              matchScore += 1;
              console.log(`  ✓ Primary use match: ${useKeywords}`);
            } else {
              // Check for related uses
              const relatedUses = {
                'daily_commute': ['commute', 'daily', 'city'],
                'family': ['family', 'spacious', 'comfortable'],
                'luxury': ['luxury', 'premium', 'comfort'],
                'performance': ['sport', 'fast', 'powerful'],
                'utility': ['work', 'practical', 'versatile']
              };
              
              const relatedTo = relatedUses[answers.primary_use] || [];
              if (relatedTo.some(keyword => carDetails.description.toLowerCase().includes(keyword))) {
                partialMatches += 0.5;
                console.log(`  ~ Primary use related: matches related keywords for ${useKeywords}`);
              } else {
                console.log(`  ✗ Primary use mismatch: doesn't match ${useKeywords}`);
              }
            }
          }

          // Calculate match percentage including partial matches
          const matchPercentage = totalCriteria > 0 
            ? ((matchScore + partialMatches) / totalCriteria) * 100 
            : 0;
          
          console.log(`  Match score: ${matchScore}/${totalCriteria} (${matchPercentage.toFixed(1)}%)`);

          // Add to potential recommendations with match score
          potentialRecommendations.push({
            ...carDetails,
            matchScore,
            matchPercentage,
            partialMatches
          });
        }
      }

      // Sort recommendations by match percentage
      potentialRecommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

      let finalRecommendation = null;
      if (potentialRecommendations.length > 0) {
        // Use the best match if it has at least 30% match
        if (potentialRecommendations[0].matchPercentage >= 30) {
          finalRecommendation = potentialRecommendations[0];
          console.log('Final Recommendation:', finalRecommendation);
          console.log(`Match percentage: ${finalRecommendation.matchPercentage.toFixed(1)}%`);
        } else {
          // If no good matches, use the first car but mark it as a partial match
          finalRecommendation = {
            ...potentialRecommendations[0],
            isPartialMatch: true,
            matchPercentage: potentialRecommendations[0].matchPercentage
          };
          console.log('Partial Match Recommendation:', finalRecommendation);
        }
      } else {
        throw new Error('No suitable cars found in the database');
      }

      setRecommendation(finalRecommendation);
      setLoading(false);
      setIsCompleting(true);

    } catch (error) {
      console.error('Error finding recommendation:', error);
      setLoading(false);
      setIsCompleting(true);
      // Don't set a default recommendation, let the UI handle the error state
    }
  };

  //UseEffect to call onComplete when recommendation is found
  useEffect(() => {
    if (recommendation) {
      onComplete(recommendation);
    }
  }, [recommendation, onComplete]);

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center">
      <div
        className={`bg-gray-800 rounded-xl p-8 max-w-md w-full ${
          animation || ''
        }`}
        style={{ animationDuration: '300ms' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-400"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-white">
          <h2 className="text-2xl font-bold mb-6">Find Your Ideal Car</h2>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
            </div>
          ) : !isCompleting ? (
            <>
              <p className="text-lg mb-4">
                {getCurrentQuestion()?.question}
              </p>
              <div className="grid grid-cols-1 gap-4">
                {getCurrentQuestion()?.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleAnswer(getCurrentQuestion().id, option.value)
                    }
                    className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-200">{option.label}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                Step {currentStep + 1} of {getTotalQuestions()}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              {recommendation ? (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    Here's your recommended car:
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="mb-4">
                      <h4 className="text-2xl font-bold text-white mb-2">
                        {recommendation.name}
                      </h4>
                      <p className="text-gray-400">
                        {recommendation.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Year</div>
                        <div className="text-white font-medium">{recommendation.year}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Body Type</div>
                        <div className="text-white font-medium capitalize">{recommendation.body_type}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-white font-medium">${recommendation.price.toLocaleString()}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Primary Use</div>
                        <div className="text-white font-medium capitalize">{recommendation.primary_use.replace('_', ' ')}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="text-sm text-gray-400 mb-2">Key Features</div>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.features.map((feature, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onComplete(recommendation)}
                    className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors flex items-center justify-center mx-auto"
                  >
                    <span>View Full Details</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </>
              ) : (
                <p className="text-gray-300">
                  No suitable car found based on your preferences.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarRecommendationWizard;