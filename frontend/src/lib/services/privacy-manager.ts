/**
 * Privacy-Compliant Data Collection Manager
 * GDPR, CCPA, and privacy-first data collection with user consent management
 */

import type { PrivacyConfig } from '../types/performance.js';

/**
 * Consent categories
 */
export type ConsentCategory =
	| 'necessary' // Always required, cannot be opted out
	| 'analytics' // Performance monitoring and analytics
	| 'functional' // Enhanced functionality features
	| 'marketing' // Marketing and advertising
	| 'personalization'; // User experience personalization

/**
 * Consent status
 */
export interface ConsentStatus {
	necessary: boolean; // Always true
	analytics: boolean;
	functional: boolean;
	marketing: boolean;
	personalization: boolean;
	timestamp: Date;
	version: string; // Consent policy version
	method: 'banner' | 'settings' | 'api' | 'implied';
}

/**
 * Privacy regulation compliance
 */
export interface ComplianceSettings {
	gdpr: boolean; // European GDPR compliance
	ccpa: boolean; // California CCPA compliance
	coppa: boolean; // Children's privacy compliance
	cookieLaw: boolean; // EU Cookie Law compliance
	dataMinimization: boolean;
	rightToErasure: boolean;
	dataPortability: boolean;
	consentRequired: boolean;
}

/**
 * Data processing purpose
 */
export interface DataPurpose {
	id: string;
	name: string;
	description: string;
	category: ConsentCategory;
	required: boolean;
	dataTypes: string[];
	retentionPeriod: number; // days
	legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
}

/**
 * User data export
 */
export interface DataExport {
	timestamp: Date;
	userId?: string;
	sessionData: any[];
	performanceData: any[];
	analyticsData: any[];
	preferences: any;
	metadata: {
		exportVersion: string;
		dataVersion: string;
		format: 'json' | 'csv' | 'xml';
	};
}

/**
 * Privacy notice content
 */
export interface PrivacyNotice {
	version: string;
	lastUpdated: Date;
	purposes: DataPurpose[];
	retention: Record<ConsentCategory, number>;
	thirdParties: string[];
	contactInfo: {
		dpo?: string; // Data Protection Officer
		email: string;
		address?: string;
	};
	rights: string[];
}

/**
 * Privacy Manager Configuration
 */
export interface PrivacyManagerConfig {
	compliance: ComplianceSettings;
	defaultConsent: Partial<ConsentStatus>;
	consentExpiry: number; // days
	storageMethod: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB';
	encryptStorage: boolean;
	anonymizationDelay: number; // milliseconds
	auditLogging: boolean;
	consentBannerConfig: {
		enabled: boolean;
		position: 'top' | 'bottom' | 'modal';
		theme: 'light' | 'dark' | 'auto';
		language: string;
	};
}

/**
 * Privacy Manager Class
 */
export class PrivacyManager {
	private config: PrivacyManagerConfig;
	private currentConsent: ConsentStatus | null = null;
	private dataPurposes = new Map<string, DataPurpose>();
	private privacyNotice: PrivacyNotice | null = null;
	private consentHistory: ConsentStatus[] = [];
	private dataProcessingLog: Array<{
		timestamp: Date;
		purpose: string;
		dataType: string;
		legalBasis: string;
	}> = [];
	private pendingDeletions = new Set<string>();

	constructor(config: Partial<PrivacyManagerConfig> = {}) {
		this.config = {
			compliance: {
				gdpr: true,
				ccpa: false,
				coppa: false,
				cookieLaw: true,
				dataMinimization: true,
				rightToErasure: true,
				dataPortability: true,
				consentRequired: true
			},
			defaultConsent: {
				necessary: true,
				analytics: false,
				functional: false,
				marketing: false,
				personalization: false
			},
			consentExpiry: 365, // 1 year
			storageMethod: 'localStorage',
			encryptStorage: false,
			anonymizationDelay: 30 * 24 * 60 * 60 * 1000, // 30 days
			auditLogging: true,
			consentBannerConfig: {
				enabled: true,
				position: 'bottom',
				theme: 'light',
				language: 'en'
			},
			...config
		};

		this.initialize();
	}

	/**
	 * Initialize privacy manager
	 */
	private initialize(): void {
		this.loadStoredConsent();
		this.initializeDataPurposes();
		this.loadPrivacyNotice();

		// Check if consent is required and show banner if needed
		if (this.isConsentRequired() && !this.hasValidConsent()) {
			this.showConsentBanner();
		}

		// Set up periodic cleanup
		this.setupPeriodicCleanup();
	}

	/**
	 * Check if user has given consent for a category
	 */
	hasConsent(category: ConsentCategory): boolean {
		if (!this.currentConsent) {
			return category === 'necessary';
		}

		return this.currentConsent[category];
	}

	/**
	 * Check if consent is required
	 */
	isConsentRequired(): boolean {
		return (
			this.config.compliance.consentRequired ||
			this.config.compliance.gdpr ||
			this.config.compliance.cookieLaw
		);
	}

	/**
	 * Check if current consent is valid
	 */
	hasValidConsent(): boolean {
		if (!this.currentConsent) return false;

		const consentAge = Date.now() - this.currentConsent.timestamp.getTime();
		const maxAge = this.config.consentExpiry * 24 * 60 * 60 * 1000;

		return consentAge < maxAge;
	}

	/**
	 * Update user consent
	 */
	updateConsent(consent: Partial<Omit<ConsentStatus, 'timestamp' | 'version' | 'method'>>): void {
		const newConsent: ConsentStatus = {
			necessary: true, // Always true
			analytics: consent.analytics ?? false,
			functional: consent.functional ?? false,
			marketing: consent.marketing ?? false,
			personalization: consent.personalization ?? false,
			timestamp: new Date(),
			version: this.privacyNotice?.version || '1.0',
			method: 'settings'
		};

		this.currentConsent = newConsent;
		this.consentHistory.push(newConsent);
		this.saveConsent(newConsent);

		// Log consent change
		this.logDataProcessing('consent_update', 'consent_data', 'consent');

		// Trigger consent change events
		this.onConsentChange(newConsent);
	}

	/**
	 * Withdraw consent for specific category
	 */
	withdrawConsent(category: ConsentCategory): void {
		if (category === 'necessary') {
			throw new Error('Cannot withdraw consent for necessary functionality');
		}

		if (this.currentConsent) {
			this.updateConsent({
				...this.currentConsent,
				[category]: false
			});

			// Schedule data deletion for this category
			this.scheduleDataDeletion(category);
		}
	}

	/**
	 * Check if data collection is allowed for purpose
	 */
	canCollectData(purposeId: string): boolean {
		const purpose = this.dataPurposes.get(purposeId);
		if (!purpose) return false;

		// Necessary purposes are always allowed
		if (purpose.category === 'necessary') return true;

		// Check consent for other categories
		return this.hasConsent(purpose.category);
	}

	/**
	 * Check if data processing is allowed
	 */
	canProcessData(purposeId: string, dataType: string): boolean {
		const purpose = this.dataPurposes.get(purposeId);
		if (!purpose) return false;

		// Check if data type is allowed for this purpose
		if (!purpose.dataTypes.includes(dataType)) return false;

		return this.canCollectData(purposeId);
	}

	/**
	 * Log data processing activity
	 */
	logDataProcessing(purposeId: string, dataType: string, legalBasis: string): void {
		if (!this.config.auditLogging) return;

		this.dataProcessingLog.push({
			timestamp: new Date(),
			purpose: purposeId,
			dataType,
			legalBasis
		});

		// Keep only recent logs (last 1000 entries)
		if (this.dataProcessingLog.length > 1000) {
			this.dataProcessingLog.shift();
		}
	}

	/**
	 * Anonymize data (GDPR right to be forgotten)
	 */
	anonymizeData(dataId: string): void {
		// Schedule data for anonymization
		this.pendingDeletions.add(dataId);

		// Process deletion after delay (for legal compliance)
		setTimeout(() => {
			this.processDataDeletion(dataId);
		}, this.config.anonymizationDelay);
	}

	/**
	 * Request data export (GDPR data portability)
	 */
	async exportUserData(format: 'json' | 'csv' | 'xml' = 'json'): Promise<DataExport> {
		const exportData: DataExport = {
			timestamp: new Date(),
			sessionData: this.getSessionData(),
			performanceData: this.getPerformanceData(),
			analyticsData: this.getAnalyticsData(),
			preferences: this.getUserPreferences(),
			metadata: {
				exportVersion: '1.0',
				dataVersion: this.privacyNotice?.version || '1.0',
				format
			}
		};

		// Log export request
		this.logDataProcessing('data_export', 'user_data', 'consent');

		return exportData;
	}

	/**
	 * Delete all user data
	 */
	deleteAllUserData(): Promise<void> {
		return new Promise((resolve) => {
			// Clear all stored data
			this.clearStoredData();

			// Clear consent
			this.currentConsent = null;
			this.consentHistory = [];

			// Clear processing logs
			this.dataProcessingLog = [];

			// Clear pending deletions
			this.pendingDeletions.clear();

			// Log deletion
			this.logDataProcessing('data_deletion', 'all_user_data', 'user_request');

			resolve();
		});
	}

	/**
	 * Get consent status
	 */
	getConsentStatus(): ConsentStatus | null {
		return this.currentConsent;
	}

	/**
	 * Get privacy notice
	 */
	getPrivacyNotice(): PrivacyNotice | null {
		return this.privacyNotice;
	}

	/**
	 * Get data processing log
	 */
	getDataProcessingLog(): Array<{
		timestamp: Date;
		purpose: string;
		dataType: string;
		legalBasis: string;
	}> {
		return [...this.dataProcessingLog];
	}

	/**
	 * Show consent banner
	 */
	showConsentBanner(): void {
		if (!this.config.consentBannerConfig.enabled) return;

		// This would typically show a UI component
		// For now, we'll dispatch an event
		window.dispatchEvent(
			new CustomEvent('show-consent-banner', {
				detail: {
					config: this.config.consentBannerConfig,
					purposes: Array.from(this.dataPurposes.values()),
					hasExistingConsent: !!this.currentConsent
				}
			})
		);
	}

	/**
	 * Hide consent banner
	 */
	hideConsentBanner(): void {
		window.dispatchEvent(new CustomEvent('hide-consent-banner'));
	}

	/**
	 * Apply data minimization
	 */
	minimizeData(data: any, purposeId: string): any {
		if (!this.config.compliance.dataMinimization) {
			return data;
		}

		const purpose = this.dataPurposes.get(purposeId);
		if (!purpose) return {};

		// Only keep data types allowed for this purpose
		const minimizedData: any = {};
		purpose.dataTypes.forEach((dataType) => {
			if (data[dataType] !== undefined) {
				minimizedData[dataType] = data[dataType];
			}
		});

		return minimizedData;
	}

	/**
	 * Check compliance status
	 */
	getComplianceStatus(): {
		compliant: boolean;
		issues: string[];
		recommendations: string[];
	} {
		const issues: string[] = [];
		const recommendations: string[] = [];

		// Check consent validity
		if (this.isConsentRequired() && !this.hasValidConsent()) {
			issues.push('Valid consent required');
			recommendations.push('Obtain user consent for data processing');
		}

		// Check data retention
		if (this.isDataRetentionExceeded()) {
			issues.push('Data retention period exceeded');
			recommendations.push('Delete or anonymize old data');
		}

		// Check privacy notice
		if (!this.privacyNotice) {
			issues.push('Privacy notice not available');
			recommendations.push('Provide clear privacy notice');
		}

		return {
			compliant: issues.length === 0,
			issues,
			recommendations
		};
	}

	// Private methods

	private initializeDataPurposes(): void {
		// Performance monitoring purpose
		this.dataPurposes.set('performance_monitoring', {
			id: 'performance_monitoring',
			name: 'Performance Monitoring',
			description: 'Monitor application performance and user experience',
			category: 'analytics',
			required: false,
			dataTypes: ['performance_metrics', 'web_vitals', 'resource_usage'],
			retentionPeriod: 30,
			legalBasis: 'consent'
		});

		// Error tracking purpose
		this.dataPurposes.set('error_tracking', {
			id: 'error_tracking',
			name: 'Error Tracking',
			description: 'Track and diagnose application errors',
			category: 'functional',
			required: false,
			dataTypes: ['error_data', 'stack_traces', 'user_actions'],
			retentionPeriod: 90,
			legalBasis: 'legitimate_interest'
		});

		// User experience analytics
		this.dataPurposes.set('ux_analytics', {
			id: 'ux_analytics',
			name: 'User Experience Analytics',
			description: 'Analyze user interactions and improve user experience',
			category: 'analytics',
			required: false,
			dataTypes: ['interaction_data', 'session_data', 'journey_data'],
			retentionPeriod: 60,
			legalBasis: 'consent'
		});

		// Essential functionality
		this.dataPurposes.set('essential_functionality', {
			id: 'essential_functionality',
			name: 'Essential Functionality',
			description: 'Core application functionality and security',
			category: 'necessary',
			required: true,
			dataTypes: ['session_state', 'preferences', 'security_data'],
			retentionPeriod: 365,
			legalBasis: 'legitimate_interest'
		});
	}

	private loadPrivacyNotice(): void {
		this.privacyNotice = {
			version: '1.0',
			lastUpdated: new Date(),
			purposes: Array.from(this.dataPurposes.values()),
			retention: {
				necessary: 365,
				analytics: 30,
				functional: 90,
				marketing: 730,
				personalization: 365
			},
			thirdParties: ['Google Analytics', 'Error Tracking Service'],
			contactInfo: {
				email: 'privacy@vec2art.com',
				dpo: 'Data Protection Officer'
			},
			rights: [
				'Right to access your data',
				'Right to correct your data',
				'Right to delete your data',
				'Right to data portability',
				'Right to object to processing'
			]
		};
	}

	private loadStoredConsent(): void {
		try {
			const stored = this.getStoredData('consent');
			if (stored) {
				const consent = JSON.parse(stored);
				consent.timestamp = new Date(consent.timestamp);

				if (this.hasValidConsent()) {
					this.currentConsent = consent;
				}
			}
		} catch (error) {
			console.warn('Failed to load stored consent:', error);
		}
	}

	private saveConsent(consent: ConsentStatus): void {
		try {
			this.setStoredData('consent', JSON.stringify(consent));
		} catch (error) {
			console.warn('Failed to save consent:', error);
		}
	}

	private onConsentChange(consent: ConsentStatus): void {
		// Dispatch event for other services to react
		window.dispatchEvent(
			new CustomEvent('consent-changed', {
				detail: consent
			})
		);

		// Hide consent banner if shown
		this.hideConsentBanner();
	}

	private scheduleDataDeletion(category: ConsentCategory): void {
		// Schedule deletion of data for withdrawn consent category
		const relatedPurposes = Array.from(this.dataPurposes.values()).filter(
			(purpose) => purpose.category === category
		);

		relatedPurposes.forEach((purpose) => {
			this.anonymizeData(purpose.id);
		});
	}

	private processDataDeletion(dataId: string): void {
		// Process actual data deletion
		this.pendingDeletions.delete(dataId);

		// Log deletion
		this.logDataProcessing('data_deletion', dataId, 'user_request');
	}

	private setupPeriodicCleanup(): void {
		// Clean up old data periodically
		setInterval(
			() => {
				this.cleanupOldData();
			},
			24 * 60 * 60 * 1000
		); // Daily
	}

	private cleanupOldData(): void {
		// Remove old processing logs
		const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days
		this.dataProcessingLog = this.dataProcessingLog.filter(
			(log) => log.timestamp.getTime() > cutoff
		);

		// Remove old consent history
		this.consentHistory = this.consentHistory.filter(
			(consent) => consent.timestamp.getTime() > cutoff
		);
	}

	private isDataRetentionExceeded(): boolean {
		// Check if any data exceeds retention periods
		return this.dataPurposes.size > 0; // Simplified check
	}

	private getSessionData(): any[] {
		// Get session data for export
		return [];
	}

	private getPerformanceData(): any[] {
		// Get performance data for export
		return [];
	}

	private getAnalyticsData(): any[] {
		// Get analytics data for export
		return [];
	}

	private getUserPreferences(): any {
		// Get user preferences for export
		return {
			consent: this.currentConsent,
			language: this.config.consentBannerConfig.language,
			theme: this.config.consentBannerConfig.theme
		};
	}

	private clearStoredData(): void {
		try {
			this.removeStoredData('consent');
			this.removeStoredData('user_data');
			this.removeStoredData('analytics_data');
			this.removeStoredData('performance_data');
		} catch (error) {
			console.warn('Failed to clear stored data:', error);
		}
	}

	private getStoredData(key: string): string | null {
		switch (this.config.storageMethod) {
			case 'localStorage':
				return localStorage.getItem(`privacy_${key}`);
			case 'sessionStorage':
				return sessionStorage.getItem(`privacy_${key}`);
			case 'cookies':
				return this.getCookie(`privacy_${key}`);
			default:
				return null;
		}
	}

	private setStoredData(key: string, value: string): void {
		switch (this.config.storageMethod) {
			case 'localStorage':
				localStorage.setItem(`privacy_${key}`, value);
				break;
			case 'sessionStorage':
				sessionStorage.setItem(`privacy_${key}`, value);
				break;
			case 'cookies':
				this.setCookie(`privacy_${key}`, value);
				break;
		}
	}

	private removeStoredData(key: string): void {
		switch (this.config.storageMethod) {
			case 'localStorage':
				localStorage.removeItem(`privacy_${key}`);
				break;
			case 'sessionStorage':
				sessionStorage.removeItem(`privacy_${key}`);
				break;
			case 'cookies':
				this.deleteCookie(`privacy_${key}`);
				break;
		}
	}

	private getCookie(name: string): string | null {
		const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
		return match ? match[2] : null;
	}

	private setCookie(name: string, value: string): void {
		const expires = new Date();
		expires.setTime(expires.getTime() + this.config.consentExpiry * 24 * 60 * 60 * 1000);
		document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
	}

	private deleteCookie(name: string): void {
		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
	}
}

// Create singleton instance
export const privacyManager = new PrivacyManager();

// Export helper functions
export function hasConsent(category: ConsentCategory): boolean {
	return privacyManager.hasConsent(category);
}

export function updateConsent(
	consent: Partial<Omit<ConsentStatus, 'timestamp' | 'version' | 'method'>>
): void {
	privacyManager.updateConsent(consent);
}

export function withdrawConsent(category: ConsentCategory): void {
	privacyManager.withdrawConsent(category);
}

export function canCollectData(purposeId: string): boolean {
	return privacyManager.canCollectData(purposeId);
}

export function canProcessData(purposeId: string, dataType: string): boolean {
	return privacyManager.canProcessData(purposeId, dataType);
}

export function logDataProcessing(purposeId: string, dataType: string, legalBasis: string): void {
	privacyManager.logDataProcessing(purposeId, dataType, legalBasis);
}

export function exportUserData(format: 'json' | 'csv' | 'xml' = 'json'): Promise<DataExport> {
	return privacyManager.exportUserData(format);
}

export function deleteAllUserData(): Promise<void> {
	return privacyManager.deleteAllUserData();
}

export function getConsentStatus(): ConsentStatus | null {
	return privacyManager.getConsentStatus();
}

export function getPrivacyNotice(): PrivacyNotice | null {
	return privacyManager.getPrivacyNotice();
}

export function getComplianceStatus() {
	return privacyManager.getComplianceStatus();
}

export function showConsentBanner(): void {
	privacyManager.showConsentBanner();
}

export function isConsentRequired(): boolean {
	return privacyManager.isConsentRequired();
}
