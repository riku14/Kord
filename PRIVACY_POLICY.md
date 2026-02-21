# Privacy Policy for Kord

**Last Updated: February 16, 2026**

## Overview

Kord is a browser extension that provides a command palette interface for Chrome. We are committed to protecting your privacy and being transparent about how our extension works.

## Data Collection

**Kord does NOT collect, transmit, or share any of your personal data.**

All data is stored locally on your device using the Chrome Storage API. We do not have access to any of your browsing data, tabs, bookmarks, or history.

## Local Storage

Kord stores the following data locally on your device:

### 1. Frecency Data (`kord_frecency`)
- **Purpose**: Track usage frequency and recency to improve search result ranking
- **Content**: Stores IDs of tabs, bookmarks, and commands you've accessed, along with usage counts and timestamps
- **Retention**: Automatically cleaned up after 90 days of inactivity
- **Location**: Chrome's local storage (chrome.storage.local)

### 2. Cleanup Timestamp (`kord_frecency_last_cleanup`)
- **Purpose**: Track when the last data cleanup was performed
- **Content**: A single timestamp value
- **Location**: Chrome's local storage (chrome.storage.local)

### 3. User Analytics (`kord_analytics`) - Future Feature
- **Purpose**: Track your own usage patterns to show personal statistics
- **Content**: Total usage count, action counts (tab switches, bookmarks opened, etc.)
- **Privacy**: 100% local, never transmitted anywhere
- **Location**: Chrome's local storage (chrome.storage.local)

### 5. Review State (`kord_review_state`) - Future Feature
- **Purpose**: Track whether you've reviewed the extension or dismissed the review prompt
- **Content**: Boolean flags and timestamps
- **Location**: Chrome's local storage (chrome.storage.local)

## Permissions Explained

Kord requires the following permissions to function:

### `tabs`
- **Why**: To search, list, and switch between your open tabs
- **What we access**: Tab titles, URLs, favicons, and tab IDs
- **How we use it**: Only for displaying search results and performing tab actions you explicitly request

### `bookmarks`
- **Why**: To search your bookmarks
- **What we access**: Bookmark titles and URLs
- **How we use it**: Only for displaying bookmark search results

### `history`
- **Why**: To search your browsing history
- **What we access**: Page titles, URLs, and visit times
- **How we use it**: Only for displaying history search results when you type in the search bar

### `browsingData`
- **Why**: To enable the "Clear Cache" command
- **What we access**: Browser cache
- **How we use it**: Only when you explicitly execute the "Clear Cache" command

### `storage`
- **Why**: To store frecency data and user preferences locally
- **What we access**: Only data that Kord itself creates
- **How we use it**: To persist your usage patterns for better search ranking

### `activeTab`
- **Why**: To identify the current tab for commands like "Close Tab" or "Pin Tab"
- **What we access**: The currently active tab's information
- **How we use it**: Only when you execute a command that affects the current tab

### `sessions`
- **Why**: To enable the "Recently Closed Tabs" feature
- **What we access**: Information about recently closed tabs and windows
- **How we use it**: Only for displaying and restoring recently closed tabs when you search for them

## Third-Party Services

**Kord does NOT use any third-party services.**

- No analytics services (e.g., Google Analytics)
- No crash reporting services
- No advertising networks
- No external APIs

The only external connection Kord makes is when you explicitly search Google using the "Search Google for..." option, which opens a new tab with Google Search. This is a standard browser navigation and is not initiated by Kord itself.

## Data Sharing

**Kord does NOT share any data with third parties.**

All data remains on your device. We do not have:
- Servers to collect data
- Analytics dashboards
- Data processing pipelines
- Any means to access your data

## Open Source

Kord is open source and available on GitHub:
**https://github.com/riku14/Kord**

You can review the source code to verify our privacy claims.

## Security

- All data is stored using Chrome's secure storage API
- No network requests are made to external servers
- URL validation is performed to prevent XSS attacks
- Message origin validation prevents unauthorized access to the extension

## Data Deletion

You can delete all Kord data at any time by:

1. **Uninstalling the extension**: All local storage data is automatically deleted
2. **Manually clearing data**:
   - Open Chrome DevTools (F12)
   - Go to Application > Storage > Local Storage
   - Delete keys starting with `kord_`

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date.

## Contact

If you have questions about this Privacy Policy or Kord's privacy practices:

- **GitHub Issues**: https://github.com/riku14/Kord/issues
- **Email**: [Your contact email if you want to provide one]

## Compliance

Kord complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

Since we do not collect any personal data, there is no data to request, export, or delete from our servers (we don't have any servers).

---

**Summary**: Kord is a privacy-first extension. All your data stays on your device. We can't see it, we don't want it, and we don't need it. Your browsing data is yours alone.
