const axios = require('axios');
const Invoice = require('../models/Invoice');
const Investment = require('../models/Investment');
const User = require('../models/User');

class RiskEngine {
  constructor() {
    this.riskFactors = {
      // Amount-based risk factors
      amount: {
        low: { min: 0, max: 10000, score: 10 },
        medium: { min: 10000, max: 100000, score: 25 },
        high: { min: 100000, max: 1000000, score: 40 },
        veryHigh: { min: 1000000, max: Infinity, score: 60 }
      },
      
      // Tenor-based risk factors
      tenor: {
        short: { min: 0, max: 30, score: 5 },
        medium: { min: 30, max: 90, score: 15 },
        long: { min: 90, max: 180, score: 30 },
        veryLong: { min: 180, max: 365, score: 45 }
      },
      
      // Currency risk factors
      currency: {
        USD: 5,
        EUR: 10,
        GBP: 15,
        other: 25
      },
      
      // Industry risk factors
      industry: {
        technology: 15,
        healthcare: 10,
        finance: 20,
        retail: 25,
        manufacturing: 20,
        construction: 35,
        energy: 30,
        other: 25
      }
    };
    
    this.riskGrades = {
      LOW: { min: 0, max: 30 },
      MEDIUM: { min: 30, max: 60 },
      HIGH: { min: 60, max: 100 }
    };
  }

  async assessInvoice(invoiceData) {
    try {
      const {
        buyerName,
        amountUSD,
        tenorDays,
        currency,
        industry,
        sellerId
      } = invoiceData;

      let totalScore = 0;
      const riskFactors = [];

      // Amount-based risk
      const amountRisk = this.calculateAmountRisk(amountUSD);
      totalScore += amountRisk.score;
      riskFactors.push(amountRisk);

      // Tenor-based risk
      const tenorRisk = this.calculateTenorRisk(tenorDays);
      totalScore += tenorRisk.score;
      riskFactors.push(tenorRisk);

      // Currency risk
      const currencyRisk = this.calculateCurrencyRisk(currency);
      totalScore += currencyRisk.score;
      riskFactors.push(currencyRisk);

      // Industry risk
      if (industry) {
        const industryRisk = this.calculateIndustryRisk(industry);
        totalScore += industryRisk.score;
        riskFactors.push(industryRisk);
      }

      // Seller history risk
      if (sellerId) {
        const sellerRisk = await this.calculateSellerRisk(sellerId);
        totalScore += sellerRisk.score;
        riskFactors.push(sellerRisk);
      }

      // Buyer credit risk (if available)
      const buyerRisk = await this.calculateBuyerRisk(buyerName);
      if (buyerRisk) {
        totalScore += buyerRisk.score;
        riskFactors.push(buyerRisk);
      }

      // Market conditions risk
      const marketRisk = await this.calculateMarketRisk();
      totalScore += marketRisk.score;
      riskFactors.push(marketRisk);

      // Determine risk grade
      const grade = this.determineRiskGrade(totalScore);
      
      // Calculate recommended yield adjustment
      const yieldAdjustment = this.calculateYieldAdjustment(totalScore, grade);

      return {
        score: Math.round(totalScore),
        grade,
        factors: riskFactors,
        yieldAdjustment,
        recommendation: this.generateRecommendation(grade, totalScore),
        assessedAt: new Date()
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      throw new Error('Failed to assess invoice risk');
    }
  }

  calculateAmountRisk(amount) {
    for (const [level, config] of Object.entries(this.riskFactors.amount)) {
      if (amount >= config.min && amount < config.max) {
        return {
          factor: 'amount',
          level,
          score: config.score,
          description: `Invoice amount of $${amount.toLocaleString()} falls in ${level} risk category`
        };
      }
    }
    
    return {
      factor: 'amount',
      level: 'veryHigh',
      score: this.riskFactors.amount.veryHigh.score,
      description: `Invoice amount of $${amount.toLocaleString()} is very high risk`
    };
  }

  calculateTenorRisk(tenorDays) {
    for (const [level, config] of Object.entries(this.riskFactors.tenor)) {
      if (tenorDays >= config.min && tenorDays < config.max) {
        return {
          factor: 'tenor',
          level,
          score: config.score,
          description: `${tenorDays} day tenor is ${level} risk`
        };
      }
    }
    
    return {
      factor: 'tenor',
      level: 'veryLong',
      score: this.riskFactors.tenor.veryLong.score,
      description: `${tenorDays} day tenor is very long term risk`
    };
  }

  calculateCurrencyRisk(currency) {
    const score = this.riskFactors.currency[currency] || this.riskFactors.currency.other;
    
    return {
      factor: 'currency',
      level: currency,
      score,
      description: `${currency} currency risk factor`
    };
  }

  calculateIndustryRisk(industry) {
    const score = this.riskFactors.industry[industry.toLowerCase()] || this.riskFactors.industry.other;
    
    return {
      factor: 'industry',
      level: industry,
      score,
      description: `${industry} industry risk factor`
    };
  }

  async calculateSellerRisk(sellerId) {
    try {
      // Get seller's historical performance
      const sellerInvoices = await Invoice.find({ sellerId }).limit(50);
      
      if (sellerInvoices.length === 0) {
        return {
          factor: 'seller_history',
          level: 'new_seller',
          score: 20,
          description: 'New seller with no transaction history'
        };
      }

      // Calculate default rate
      const defaultedInvoices = sellerInvoices.filter(inv => inv.status === 'DEFAULTED');
      const defaultRate = defaultedInvoices.length / sellerInvoices.length;
      
      // Calculate average payment delay
      const paidInvoices = sellerInvoices.filter(inv => inv.status === 'PAID');
      let avgDelayDays = 0;
      
      if (paidInvoices.length > 0) {
        const totalDelay = paidInvoices.reduce((sum, inv) => {
          if (inv.paidAt && inv.maturityDate) {
            const delay = Math.max(0, (inv.paidAt - inv.maturityDate) / (1000 * 60 * 60 * 24));
            return sum + delay;
          }
          return sum;
        }, 0);
        avgDelayDays = totalDelay / paidInvoices.length;
      }

      // Calculate risk score
      let score = 0;
      let level = 'good';
      
      if (defaultRate > 0.1) {
        score += 30;
        level = 'high_default';
      } else if (defaultRate > 0.05) {
        score += 15;
        level = 'medium_default';
      }
      
      if (avgDelayDays > 30) {
        score += 20;
        level = level === 'good' ? 'high_delay' : level;
      } else if (avgDelayDays > 10) {
        score += 10;
        level = level === 'good' ? 'medium_delay' : level;
      }

      return {
        factor: 'seller_history',
        level,
        score,
        description: `Seller has ${(defaultRate * 100).toFixed(1)}% default rate and ${avgDelayDays.toFixed(1)} days average delay`,
        metrics: {
          totalInvoices: sellerInvoices.length,
          defaultRate: defaultRate,
          avgDelayDays: avgDelayDays
        }
      };
    } catch (error) {
      console.error('Seller risk calculation error:', error);
      return {
        factor: 'seller_history',
        level: 'unknown',
        score: 15,
        description: 'Unable to assess seller history'
      };
    }
  }

  async calculateBuyerRisk(buyerName) {
    try {
      // Check internal database for buyer history
      const buyerInvoices = await Invoice.find({ 
        buyerName: { $regex: new RegExp(buyerName, 'i') } 
      }).limit(20);

      if (buyerInvoices.length === 0) {
        return {
          factor: 'buyer_history',
          level: 'new_buyer',
          score: 15,
          description: 'New buyer with no payment history'
        };
      }

      // Calculate buyer payment performance
      const paidInvoices = buyerInvoices.filter(inv => inv.status === 'PAID');
      const defaultedInvoices = buyerInvoices.filter(inv => inv.status === 'DEFAULTED');
      
      const paymentRate = paidInvoices.length / buyerInvoices.length;
      const defaultRate = defaultedInvoices.length / buyerInvoices.length;

      let score = 0;
      let level = 'good';

      if (defaultRate > 0.1) {
        score = 25;
        level = 'poor';
      } else if (defaultRate > 0.05) {
        score = 15;
        level = 'fair';
      } else if (paymentRate > 0.9) {
        score = 5;
        level = 'excellent';
      } else {
        score = 10;
        level = 'good';
      }

      return {
        factor: 'buyer_history',
        level,
        score,
        description: `Buyer has ${(paymentRate * 100).toFixed(1)}% payment rate from ${buyerInvoices.length} invoices`,
        metrics: {
          totalInvoices: buyerInvoices.length,
          paymentRate,
          defaultRate
        }
      };
    } catch (error) {
      console.error('Buyer risk calculation error:', error);
      return null;
    }
  }

  async calculateMarketRisk() {
    try {
      // This would integrate with external market data APIs
      // For now, we'll use a simplified approach
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      
      // Seasonal risk factors (simplified)
      let seasonalRisk = 5;
      if ([11, 0, 1].includes(currentMonth)) { // Dec, Jan, Feb
        seasonalRisk = 10; // Higher risk during holiday season
      }
      
      // Economic indicators (would be fetched from external APIs)
      const economicRisk = 5; // Base economic risk
      
      const totalMarketRisk = seasonalRisk + economicRisk;
      
      return {
        factor: 'market_conditions',
        level: totalMarketRisk > 10 ? 'elevated' : 'normal',
        score: totalMarketRisk,
        description: `Current market conditions present ${totalMarketRisk > 10 ? 'elevated' : 'normal'} risk`
      };
    } catch (error) {
      console.error('Market risk calculation error:', error);
      return {
        factor: 'market_conditions',
        level: 'unknown',
        score: 10,
        description: 'Unable to assess current market conditions'
      };
    }
  }

  determineRiskGrade(totalScore) {
    for (const [grade, range] of Object.entries(this.riskGrades)) {
      if (totalScore >= range.min && totalScore < range.max) {
        return grade;
      }
    }
    return 'HIGH'; // Default to HIGH if score exceeds all ranges
  }

  calculateYieldAdjustment(riskScore, riskGrade) {
    // Suggest yield adjustments based on risk
    const baseAdjustments = {
      LOW: { min: 0, max: 50 }, // 0-0.5% adjustment
      MEDIUM: { min: 50, max: 150 }, // 0.5-1.5% adjustment
      HIGH: { min: 150, max: 300 } // 1.5-3% adjustment
    };
    
    const adjustment = baseAdjustments[riskGrade];
    const scaledAdjustment = adjustment.min + 
      ((riskScore - this.riskGrades[riskGrade].min) / 
       (this.riskGrades[riskGrade].max - this.riskGrades[riskGrade].min)) * 
      (adjustment.max - adjustment.min);
    
    return {
      basisPoints: Math.round(scaledAdjustment),
      percentage: (scaledAdjustment / 100).toFixed(2),
      recommendation: `Consider increasing yield by ${(scaledAdjustment / 100).toFixed(2)}% to compensate for ${riskGrade.toLowerCase()} risk`
    };
  }

  generateRecommendation(grade, score) {
    const recommendations = {
      LOW: [
        'This invoice presents low risk for investors',
        'Consider standard yield rates',
        'Suitable for conservative investors',
        'Monitor for any changes in buyer circumstances'
      ],
      MEDIUM: [
        'This invoice presents moderate risk',
        'Consider yield premium to compensate for risk',
        'Suitable for balanced risk investors',
        'Enhanced due diligence recommended',
        'Monitor payment closely'
      ],
      HIGH: [
        'This invoice presents high risk',
        'Significant yield premium recommended',
        'Only suitable for risk-tolerant investors',
        'Comprehensive due diligence required',
        'Consider additional security measures',
        'Close monitoring essential'
      ]
    };
    
    return {
      grade,
      score,
      actions: recommendations[grade],
      priority: grade === 'HIGH' ? 'urgent' : grade === 'MEDIUM' ? 'important' : 'normal'
    };
  }

  async assessInvestorRisk(investorId, investmentAmount, invoiceId) {
    try {
      const investor = await User.findById(investorId);
      if (!investor) {
        throw new Error('Investor not found');
      }

      // Get investor's investment history
      const investments = await Investment.find({ investorId }).populate('invoiceId');
      
      // Calculate portfolio metrics
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amountUSD, 0);
      const activeInvestments = investments.filter(inv => inv.status === 'ACTIVE');
      const completedInvestments = investments.filter(inv => inv.status === 'COMPLETED');
      
      // Portfolio concentration risk
      const portfolioConcentration = totalInvested > 0 ? (investmentAmount / totalInvested) * 100 : 100;
      
      // Risk diversification
      const uniqueInvoices = new Set(investments.map(inv => inv.invoiceId._id.toString()));
      const diversificationScore = uniqueInvoices.size;
      
      // Calculate risk score
      let riskScore = 0;
      const riskFactors = [];
      
      // Concentration risk
      if (portfolioConcentration > 50) {
        riskScore += 30;
        riskFactors.push('High portfolio concentration');
      } else if (portfolioConcentration > 25) {
        riskScore += 15;
        riskFactors.push('Moderate portfolio concentration');
      }
      
      // Diversification risk
      if (diversificationScore < 3) {
        riskScore += 20;
        riskFactors.push('Low diversification');
      } else if (diversificationScore < 5) {
        riskScore += 10;
        riskFactors.push('Moderate diversification');
      }
      
      // Experience risk
      if (investments.length < 3) {
        riskScore += 15;
        riskFactors.push('Limited investment experience');
      }
      
      return {
        investorId,
        riskScore,
        riskFactors,
        portfolioMetrics: {
          totalInvested,
          activeInvestments: activeInvestments.length,
          completedInvestments: completedInvestments.length,
          portfolioConcentration,
          diversificationScore
        },
        recommendation: riskScore > 40 ? 'HIGH_RISK' : riskScore > 20 ? 'MEDIUM_RISK' : 'LOW_RISK'
      };
    } catch (error) {
      console.error('Investor risk assessment error:', error);
      throw new Error('Failed to assess investor risk');
    }
  }

  async getMarketRiskMetrics() {
    try {
      // Calculate platform-wide risk metrics
      const totalInvoices = await Invoice.countDocuments();
      const activeInvoices = await Invoice.countDocuments({ status: { $in: ['LISTED', 'FUNDING', 'FUNDED'] } });
      const defaultedInvoices = await Invoice.countDocuments({ status: 'DEFAULTED' });
      
      const defaultRate = totalInvoices > 0 ? (defaultedInvoices / totalInvoices) * 100 : 0;
      
      // Risk distribution
      const riskDistribution = await Invoice.aggregate([
        {
          $group: {
            _id: '$riskGrade',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amountUSD' }
          }
        }
      ]);
      
      // Average risk score by industry
      const industryRisk = await Invoice.aggregate([
        {
          $group: {
            _id: '$industry',
            avgRiskScore: { $avg: '$riskScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { avgRiskScore: -1 } }
      ]);
      
      return {
        totalInvoices,
        activeInvoices,
        defaultedInvoices,
        defaultRate: Math.round(defaultRate * 100) / 100,
        riskDistribution,
        industryRisk,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Market risk metrics error:', error);
      throw new Error('Failed to calculate market risk metrics');
    }
  }
}

module.exports = new RiskEngine();