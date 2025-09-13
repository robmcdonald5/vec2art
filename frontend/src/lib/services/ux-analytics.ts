/**
 * User Experience Analytics and Session Tracking
 * Comprehensive UX monitoring, session tracking, and user journey analysis
 */

import type {
	UXAnalytics,
	SessionData,
	UserInteraction,
	PageView,
	FlowStep
} from '../types/performance.js';
import { trackCustomMetric, trackUserInteraction } from './performance-monitor.js';
import { addErrorBreadcrumb } from './error-tracker.js';

/**
 * User journey step
 */
export interface JourneyStep {
	stepId: string;
	stepName: string;
	timestamp: Date;
	duration?: number;
	metadata?: Record<string, any>;
	exitPoint?: boolean;
	conversionGoal?: boolean;
}

/**
 * Feature usage tracking
 */
export interface FeatureUsage {
	featureName: string;
	usageCount: number;
	totalTime: number;
	averageTime: number;
	lastUsed: Date;
	completionRate: number;
	errorRate: number;
}

/**
 * User engagement metrics
 */
export interface EngagementMetrics {
	sessionDuration: number;
	pageViews: number;
	interactions: number;
	bounceRate: number;
	timeToFirstInteraction: number;
	deepEngagement: boolean;
	returnVisitor: boolean;
}

/**
 * Task completion tracking
 */
export interface TaskCompletion {
	taskId: string;
	taskName: string;
	startTime: Date;
	endTime?: Date;
	completed: boolean;
	steps: JourneyStep[];
	errors: string[];
	attempts: number;
	timeToComplete?: number;
	abandonmentPoint?: string;
}

/**
 * UX heuristics evaluation
 */
export interface UXHeuristics {
	usability: number; // 0-100 score
	accessibility: number; // 0-100 score
	performance: number; // 0-100 score
	errorPrevention: number; // 0-100 score
	userSatisfaction: number; // 0-100 score
	overallScore: number; // 0-100 score
}

/**
 * User Experience Analytics Class
 */
export class UXAnalyticsService {
	private currentSession: SessionData | null = null;
	private journeySteps: JourneyStep[] = [];
	private featureUsage = new Map<string, FeatureUsage>();
	private activeTasks = new Map<string, TaskCompletion>();
	private completedTasks: TaskCompletion[] = [];
	private userFlowFunnels = new Map<string, FlowStep[]>();
	private interactionTimings = new Map<string, number>();
	private engagementStartTime = Date.now();
	private lastInteractionTime = Date.now();
	private isTracking = false;

	constructor() {
		this.initializeTracking();
	}

	/**
	 * Start UX analytics tracking
	 */
	startTracking(): void {
		if (this.isTracking) return;

		this.isTracking = true;
		this.engagementStartTime = Date.now();
		this.lastInteractionTime = Date.now();

		this.setupEventListeners();
		this.startEngagementTracking();

		addErrorBreadcrumb('UX analytics tracking started');
	}

	/**
	 * Stop UX analytics tracking
	 */
	stopTracking(): void {
		if (!this.isTracking) return;

		this.isTracking = false;
		this.cleanupEventListeners();

		addErrorBreadcrumb('UX analytics tracking stopped');
	}

	/**
	 * Track page view
	 */
	trackPageView(url: string, title?: string, metadata?: Record<string, any>): void {
		const pageView: PageView = {
			url,
			timestamp: new Date(),
			duration: undefined
		};

		if (this.currentSession) {
			this.currentSession.pageViews.push(pageView);
		}

		this.addJourneyStep('page_view', `Page: ${title || url}`, { url, title, ...metadata });

		trackCustomMetric('page_view', 1, { url, title: title || 'unknown' });
	}

	/**
	 * Track user interaction
	 */
	trackInteraction(
		type: UserInteraction['type'],
		target: string,
		metadata?: Record<string, any>,
		duration?: number
	): void {
		const interaction: UserInteraction = {
			type,
			target,
			timestamp: new Date(),
			duration,
			success: true,
			metadata
		};

		// Update last interaction time
		this.lastInteractionTime = Date.now();

		// Add to session
		if (this.currentSession) {
			this.currentSession.interactions.push(interaction);
		}

		// Track interaction timing
		if (duration) {
			this.interactionTimings.set(`${type}_${target}`, duration);
		}

		// Add journey step
		this.addJourneyStep('interaction', `${type}: ${target}`, {
			type,
			target,
			duration,
			...metadata
		});

		// Track via performance monitor
		trackUserInteraction(interaction);

		// Track metrics
		trackCustomMetric('user_interaction', 1, {
			type,
			target,
			success: 'true'
		});

		if (duration) {
			trackCustomMetric('interaction_duration', duration, { type, target });
		}
	}

	/**
	 * Track feature usage
	 */
	trackFeatureUsage(
		featureName: string,
		duration?: number,
		completed = true,
		error?: string
	): void {
		let usage = this.featureUsage.get(featureName);

		if (!usage) {
			usage = {
				featureName,
				usageCount: 0,
				totalTime: 0,
				averageTime: 0,
				lastUsed: new Date(),
				completionRate: 0,
				errorRate: 0
			};
			this.featureUsage.set(featureName, usage);
		}

		usage.usageCount++;
		usage.lastUsed = new Date();

		if (duration) {
			usage.totalTime += duration;
			usage.averageTime = usage.totalTime / usage.usageCount;
		}

		// Update completion rate
		const previousCompletions = Math.round((usage.completionRate * (usage.usageCount - 1)) / 100);
		const newCompletions = completed ? previousCompletions + 1 : previousCompletions;
		usage.completionRate = (newCompletions / usage.usageCount) * 100;

		// Update error rate
		const previousErrors = Math.round((usage.errorRate * (usage.usageCount - 1)) / 100);
		const newErrors = error ? previousErrors + 1 : previousErrors;
		usage.errorRate = (newErrors / usage.usageCount) * 100;

		this.addJourneyStep('feature_usage', `Feature: ${featureName}`, {
			featureName,
			duration,
			completed,
			error
		});

		trackCustomMetric('feature_usage', 1, {
			feature: featureName,
			completed: completed.toString(),
			hasError: (!!error).toString()
		});

		if (duration) {
			trackCustomMetric('feature_duration', duration, { feature: featureName });
		}
	}

	/**
	 * Start task tracking
	 */
	startTask(taskId: string, taskName: string, metadata?: Record<string, any>): void {
		const task: TaskCompletion = {
			taskId,
			taskName,
			startTime: new Date(),
			completed: false,
			steps: [],
			errors: [],
			attempts: 1
		};

		this.activeTasks.set(taskId, task);

		this.addJourneyStep('task_start', `Task: ${taskName}`, {
			taskId,
			taskName,
			...metadata
		});

		trackCustomMetric('task_started', 1, { taskId, taskName });
	}

	/**
	 * Add step to task
	 */
	addTaskStep(taskId: string, stepName: string, metadata?: Record<string, any>): void {
		const task = this.activeTasks.get(taskId);
		if (!task) return;

		const step: JourneyStep = {
			stepId: `${taskId}_${Date.now()}`,
			stepName,
			timestamp: new Date(),
			metadata
		};

		task.steps.push(step);

		this.addJourneyStep('task_step', `${task.taskName}: ${stepName}`, {
			taskId,
			stepName,
			...metadata
		});

		trackCustomMetric('task_step', 1, {
			taskId,
			stepName,
			taskName: task.taskName
		});
	}

	/**
	 * Complete task
	 */
	completeTask(taskId: string, success = true, metadata?: Record<string, any>): void {
		const task = this.activeTasks.get(taskId);
		if (!task) return;

		task.endTime = new Date();
		task.completed = success;
		task.timeToComplete = task.endTime.getTime() - task.startTime.getTime();

		this.activeTasks.delete(taskId);
		this.completedTasks.push(task);

		this.addJourneyStep(
			'task_complete',
			`Task ${success ? 'completed' : 'failed'}: ${task.taskName}`,
			{
				taskId,
				success,
				duration: task.timeToComplete,
				steps: task.steps.length,
				...metadata
			}
		);

		trackCustomMetric('task_completed', 1, {
			taskId,
			taskName: task.taskName,
			success: success.toString(),
			steps: task.steps.length.toString()
		});

		if (task.timeToComplete) {
			trackCustomMetric('task_duration', task.timeToComplete, {
				taskId,
				taskName: task.taskName,
				success: success.toString()
			});
		}
	}

	/**
	 * Track task error
	 */
	trackTaskError(taskId: string, error: string, metadata?: Record<string, any>): void {
		const task = this.activeTasks.get(taskId);
		if (!task) return;

		task.errors.push(error);

		this.addJourneyStep('task_error', `Task error: ${error}`, {
			taskId,
			taskName: task.taskName,
			error,
			...metadata
		});

		trackCustomMetric('task_error', 1, {
			taskId,
			taskName: task.taskName,
			error
		});
	}

	/**
	 * Track user flow funnel
	 */
	trackFunnelStep(funnelName: string, stepName: string, completed = true): void {
		let funnel = this.userFlowFunnels.get(funnelName);
		if (!funnel) {
			funnel = [];
			this.userFlowFunnels.set(funnelName, funnel);
		}

		const step: FlowStep = {
			stepName,
			timestamp: Date.now(),
			duration: 0,
			completed
		};

		// Calculate duration from previous step
		if (funnel.length > 0) {
			const previousStep = funnel[funnel.length - 1];
			step.duration = step.timestamp - previousStep.timestamp;
		}

		funnel.push(step);

		this.addJourneyStep('funnel_step', `${funnelName}: ${stepName}`, {
			funnelName,
			stepName,
			completed,
			stepIndex: funnel.length
		});

		trackCustomMetric('funnel_step', 1, {
			funnel: funnelName,
			step: stepName,
			completed: completed.toString(),
			stepIndex: funnel.length.toString()
		});
	}

	/**
	 * Get current UX analytics
	 */
	getUXAnalytics(): UXAnalytics {
		const now = Date.now();
		const sessionDuration = now - this.engagementStartTime;
		const _timeSinceLastInteraction = now - this.lastInteractionTime;

		const totalInteractions = this.currentSession?.interactions.length || 0;
		const completedTasks = this.completedTasks.filter((t) => t.completed).length;
		const totalTasks = this.completedTasks.length + this.activeTasks.size;

		const errorCount = this.completedTasks.reduce((sum, task) => sum + task.errors.length, 0);

		return {
			timeToFirstInteraction: this.calculateTimeToFirstInteraction(),
			interactionResponseTime: this.calculateAverageResponseTime(),
			taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
			averageTaskTime: this.calculateAverageTaskTime(),
			featureUsageStats: this.getFeatureUsageStats(),
			userFlowAnalytics: this.getFlowAnalytics(),
			errorEncounterRate: totalInteractions > 0 ? (errorCount / totalInteractions) * 100 : 0,
			retryAttempts: this.calculateRetryAttempts(),
			sessionDuration
		};
	}

	/**
	 * Get engagement metrics
	 */
	getEngagementMetrics(): EngagementMetrics {
		const now = Date.now();
		const sessionDuration = now - this.engagementStartTime;
		const timeSinceLastInteraction = now - this.lastInteractionTime;

		return {
			sessionDuration,
			pageViews: this.currentSession?.pageViews.length || 0,
			interactions: this.currentSession?.interactions.length || 0,
			bounceRate: this.calculateBounceRate(),
			timeToFirstInteraction: this.calculateTimeToFirstInteraction(),
			deepEngagement: sessionDuration > 60000 && timeSinceLastInteraction < 30000, // 1min+ session, active within 30s
			returnVisitor: this.isReturnVisitor()
		};
	}

	/**
	 * Get UX heuristics evaluation
	 */
	getUXHeuristics(): UXHeuristics {
		const usability = this.evaluateUsability();
		const accessibility = this.evaluateAccessibility();
		const performance = this.evaluatePerformance();
		const errorPrevention = this.evaluateErrorPrevention();
		const userSatisfaction = this.evaluateUserSatisfaction();

		const overallScore =
			(usability + accessibility + performance + errorPrevention + userSatisfaction) / 5;

		return {
			usability,
			accessibility,
			performance,
			errorPrevention,
			userSatisfaction,
			overallScore
		};
	}

	/**
	 * Get user journey
	 */
	getUserJourney(): JourneyStep[] {
		return [...this.journeySteps];
	}

	/**
	 * Get feature usage statistics
	 */
	getFeatureUsageStatistics(): FeatureUsage[] {
		return Array.from(this.featureUsage.values());
	}

	/**
	 * Get task completion statistics
	 */
	getTaskStatistics(): {
		completed: TaskCompletion[];
		active: TaskCompletion[];
		completionRate: number;
		averageTime: number;
		commonFailurePoints: string[];
	} {
		const completed = this.completedTasks.filter((t) => t.completed);
		const active = Array.from(this.activeTasks.values());
		const totalTasks = this.completedTasks.length;

		const completionRate = totalTasks > 0 ? (completed.length / totalTasks) * 100 : 0;
		const averageTime =
			completed.length > 0
				? completed.reduce((sum, t) => sum + (t.timeToComplete || 0), 0) / completed.length
				: 0;

		const failurePoints = this.completedTasks
			.filter((t) => !t.completed)
			.map((t) => t.abandonmentPoint || 'unknown')
			.reduce(
				(acc, point) => {
					acc[point] = (acc[point] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

		const commonFailurePoints = Object.entries(failurePoints)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([point]) => point);

		return {
			completed,
			active,
			completionRate,
			averageTime,
			commonFailurePoints
		};
	}

	/**
	 * Export UX data
	 */
	exportUXData(): {
		analytics: UXAnalytics;
		engagement: EngagementMetrics;
		heuristics: UXHeuristics;
		journey: JourneyStep[];
		features: FeatureUsage[];
		tasks: ReturnType<UXAnalyticsService['getTaskStatistics']>;
		funnels: Record<string, FlowStep[]>;
	} {
		return {
			analytics: this.getUXAnalytics(),
			engagement: this.getEngagementMetrics(),
			heuristics: this.getUXHeuristics(),
			journey: this.getUserJourney(),
			features: this.getFeatureUsageStatistics(),
			tasks: this.getTaskStatistics(),
			funnels: Object.fromEntries(this.userFlowFunnels)
		};
	}

	// Private methods

	private initializeTracking(): void {
		// Initialize session if not exists
		if (!this.currentSession) {
			this.currentSession = {
				sessionId: this.generateSessionId(),
				startTime: new Date(),
				userAgent: navigator.userAgent,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight
				},
				pageViews: [],
				interactions: [],
				errors: [],
				performanceMetrics: []
			};
		}
	}

	private setupEventListeners(): void {
		// Click tracking
		document.addEventListener('click', this.handleClick.bind(this), true);

		// Scroll tracking
		document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

		// Input tracking
		document.addEventListener('input', this.handleInput.bind(this), true);

		// Focus tracking
		document.addEventListener('focus', this.handleFocus.bind(this), true);

		// Visibility change
		document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

		// Beforeunload for session end
		window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
	}

	private cleanupEventListeners(): void {
		document.removeEventListener('click', this.handleClick.bind(this), true);
		document.removeEventListener('scroll', this.handleScroll.bind(this));
		document.removeEventListener('input', this.handleInput.bind(this), true);
		document.removeEventListener('focus', this.handleFocus.bind(this), true);
		document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
		window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
	}

	private handleClick(event: Event): void {
		const target = event.target as HTMLElement;
		const elementInfo = this.getElementInfo(target);

		this.trackInteraction('click', elementInfo.selector, {
			tagName: target.tagName,
			className: target.className,
			id: target.id,
			text: elementInfo.text
		});
	}

	private handleScroll(_event: Event): void {
		// Throttle scroll events
		if (!this.scrollTimeout) {
			this.scrollTimeout = setTimeout(() => {
				this.trackInteraction('scroll', 'page', {
					scrollY: window.scrollY,
					scrollX: window.scrollX
				});
				this.scrollTimeout = null;
			}, 250);
		}
	}
	private scrollTimeout: ReturnType<typeof setTimeout> | null = null;

	private handleInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		const elementInfo = this.getElementInfo(target);

		this.trackInteraction('input', elementInfo.selector, {
			inputType: target.type,
			tagName: target.tagName
		});
	}

	private handleFocus(event: Event): void {
		const target = event.target as HTMLElement;
		const elementInfo = this.getElementInfo(target);

		this.trackInteraction('click', elementInfo.selector, {
			eventType: 'focus',
			tagName: target.tagName
		});
	}

	private handleVisibilityChange(): void {
		if (document.hidden) {
			this.addJourneyStep('visibility_change', 'Page hidden');
		} else {
			this.addJourneyStep('visibility_change', 'Page visible');
		}
	}

	private handleBeforeUnload(): void {
		// Complete any active tasks as abandoned
		this.activeTasks.forEach((task, taskId) => {
			task.abandonmentPoint =
				task.steps.length > 0 ? task.steps[task.steps.length - 1].stepName : 'task_start';
			this.completeTask(taskId, false);
		});
	}

	private getElementInfo(element: HTMLElement): { selector: string; text: string } {
		let selector = element.tagName.toLowerCase();

		if (element.id) {
			selector += `#${element.id}`;
		} else if (element.className) {
			const classes = element.className.split(' ').filter((c) => c.length > 0);
			if (classes.length > 0) {
				selector += `.${classes[0]}`;
			}
		}

		const text = element.textContent?.trim().substring(0, 50) || '';

		return { selector, text };
	}

	private addJourneyStep(type: string, description: string, metadata?: Record<string, any>): void {
		const step: JourneyStep = {
			stepId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			stepName: description,
			timestamp: new Date(),
			metadata: { type, ...metadata }
		};

		this.journeySteps.push(step);

		// Keep only last 1000 steps
		if (this.journeySteps.length > 1000) {
			this.journeySteps.shift();
		}
	}

	private startEngagementTracking(): void {
		// Track engagement every 30 seconds
		setInterval(() => {
			if (this.isTracking) {
				const engagement = this.getEngagementMetrics();
				trackCustomMetric('session_duration', engagement.sessionDuration);
				trackCustomMetric('interaction_count', engagement.interactions);
			}
		}, 30000);
	}

	private calculateTimeToFirstInteraction(): number {
		if (!this.currentSession || this.currentSession.interactions.length === 0) {
			return 0;
		}

		const firstInteraction = this.currentSession.interactions[0];
		return firstInteraction.timestamp.getTime() - this.currentSession.startTime.getTime();
	}

	private calculateAverageResponseTime(): number {
		const durations = Array.from(this.interactionTimings.values());
		return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
	}

	private calculateAverageTaskTime(): number {
		const completedTasks = this.completedTasks.filter((t) => t.completed && t.timeToComplete);
		return completedTasks.length > 0
			? completedTasks.reduce((sum, t) => sum + (t.timeToComplete || 0), 0) / completedTasks.length
			: 0;
	}

	private getFeatureUsageStats(): Record<string, number> {
		const stats: Record<string, number> = {};
		this.featureUsage.forEach((usage, featureName) => {
			stats[featureName] = usage.usageCount;
		});
		return stats;
	}

	private getFlowAnalytics(): FlowStep[] {
		const allSteps: FlowStep[] = [];
		this.userFlowFunnels.forEach((funnel) => {
			allSteps.push(...funnel);
		});
		return allSteps.sort((a, b) => a.timestamp - b.timestamp);
	}

	private calculateRetryAttempts(): number {
		return this.completedTasks.reduce((sum, task) => sum + (task.attempts - 1), 0);
	}

	private calculateBounceRate(): number {
		const interactions = this.currentSession?.interactions.length || 0;
		const pageViews = this.currentSession?.pageViews.length || 0;

		// Simple heuristic: bounce if < 2 interactions or < 30 seconds
		const sessionDuration = Date.now() - this.engagementStartTime;
		const isBounce = interactions < 2 || sessionDuration < 30000;

		return pageViews > 0 && isBounce ? 100 : 0;
	}

	private isReturnVisitor(): boolean {
		// Check if there's stored session data (simplified)
		try {
			return localStorage.getItem('vec2art_previous_session') !== null;
		} catch {
			return false;
		}
	}

	private evaluateUsability(): number {
		const taskStats = this.getTaskStatistics();
		const engagement = this.getEngagementMetrics();

		let score = 100;

		// Penalize low task completion rate
		if (taskStats.completionRate < 80) {
			score -= (80 - taskStats.completionRate) * 0.5;
		}

		// Penalize high bounce rate
		if (engagement.bounceRate > 50) {
			score -= (engagement.bounceRate - 50) * 0.3;
		}

		// Penalize long task times (assuming >2 minutes is too long)
		if (taskStats.averageTime > 120000) {
			score -= Math.min(30, (taskStats.averageTime - 120000) / 10000);
		}

		return Math.max(0, Math.min(100, score));
	}

	private evaluateAccessibility(): number {
		// Basic accessibility heuristics
		let score = 100;

		// Check for keyboard navigation (simplified)
		const keyboardInteractions =
			this.currentSession?.interactions.filter((i) => i.metadata?.eventType === 'focus').length ||
			0;

		if (keyboardInteractions === 0) {
			score -= 20; // No keyboard interaction detected
		}

		return Math.max(0, Math.min(100, score));
	}

	private evaluatePerformance(): number {
		// Would integrate with performance metrics
		// For now, return a baseline score
		return 80;
	}

	private evaluateErrorPrevention(): number {
		const analytics = this.getUXAnalytics();
		let score = 100;

		// Penalize high error encounter rate
		if (analytics.errorEncounterRate > 10) {
			score -= (analytics.errorEncounterRate - 10) * 2;
		}

		// Penalize high retry attempts
		if (analytics.retryAttempts > 5) {
			score -= (analytics.retryAttempts - 5) * 3;
		}

		return Math.max(0, Math.min(100, score));
	}

	private evaluateUserSatisfaction(): number {
		const engagement = this.getEngagementMetrics();
		const taskStats = this.getTaskStatistics();

		let score = 100;

		// Positive indicators
		if (engagement.deepEngagement) score += 10;
		if (taskStats.completionRate > 90) score += 10;
		if (engagement.sessionDuration > 180000) score += 5; // 3+ minutes

		// Negative indicators
		if (engagement.bounceRate > 70) score -= 20;
		if (taskStats.completionRate < 50) score -= 30;

		return Math.max(0, Math.min(100, score));
	}

	private generateSessionId(): string {
		return `ux_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Create singleton instance
export const uxAnalytics = new UXAnalyticsService();

// Export helper functions
export function startUXTracking(): void {
	uxAnalytics.startTracking();
}

export function stopUXTracking(): void {
	uxAnalytics.stopTracking();
}

export function trackPageView(url: string, title?: string, metadata?: Record<string, any>): void {
	uxAnalytics.trackPageView(url, title, metadata);
}

export function trackInteraction(
	type: UserInteraction['type'],
	target: string,
	metadata?: Record<string, any>,
	duration?: number
): void {
	uxAnalytics.trackInteraction(type, target, metadata, duration);
}

export function trackFeatureUsage(
	featureName: string,
	duration?: number,
	completed = true,
	error?: string
): void {
	uxAnalytics.trackFeatureUsage(featureName, duration, completed, error);
}

export function startTask(taskId: string, taskName: string, metadata?: Record<string, any>): void {
	uxAnalytics.startTask(taskId, taskName, metadata);
}

export function addTaskStep(
	taskId: string,
	stepName: string,
	metadata?: Record<string, any>
): void {
	uxAnalytics.addTaskStep(taskId, stepName, metadata);
}

export function completeTask(taskId: string, success = true, metadata?: Record<string, any>): void {
	uxAnalytics.completeTask(taskId, success, metadata);
}

export function trackTaskError(
	taskId: string,
	error: string,
	metadata?: Record<string, any>
): void {
	uxAnalytics.trackTaskError(taskId, error, metadata);
}

export function trackFunnelStep(funnelName: string, stepName: string, completed = true): void {
	uxAnalytics.trackFunnelStep(funnelName, stepName, completed);
}

export function getUXAnalytics(): UXAnalytics {
	return uxAnalytics.getUXAnalytics();
}

export function getEngagementMetrics(): EngagementMetrics {
	return uxAnalytics.getEngagementMetrics();
}

export function getUXHeuristics(): UXHeuristics {
	return uxAnalytics.getUXHeuristics();
}

export function getUserJourney(): JourneyStep[] {
	return uxAnalytics.getUserJourney();
}

export function exportUXData() {
	return uxAnalytics.exportUXData();
}
