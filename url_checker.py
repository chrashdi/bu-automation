#!/usr/bin/env python3
"""
Kayako URL Checker Tool
Reads URLs from sfdc-url-list.md and checks if Kayako instances are active.
Checks for the specific error message indicating unavailable instances.
Outputs results to a CSV file.
"""

import csv
import requests
from urllib.parse import urlparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import time
import threading

# Configuration
TIMEOUT = 20  # seconds - increased for page content loading
MAX_WORKERS = 20  # Number of concurrent requests - reduced to avoid overwhelming servers
REQUEST_DELAY = 0.5  # seconds - delay between requests to be respectful to servers
INPUT_FILE = 'sfdc-url-list.md'
OUTPUT_FILE = 'url_check_results.csv'

# Error message to check for
KAYAKO_ERROR_MESSAGE = "Either this Kayako instance does not exist or we are facing temporary problems. Please try again in a few minutes"

# Rate limiter to space out requests
rate_limiter_lock = threading.Lock()
last_request_time = [0]  # Use list to allow modification in nested function


def wait_for_rate_limit():
    """Ensure minimum delay between requests."""
    with rate_limiter_lock:
        current_time = time.time()
        time_since_last = current_time - last_request_time[0]
        if time_since_last < REQUEST_DELAY:
            sleep_time = REQUEST_DELAY - time_since_last
            time.sleep(sleep_time)
        last_request_time[0] = time.time()


def normalize_url(url_line):
    """Normalize URL by adding https:// if protocol is missing."""
    url_line = url_line.strip()
    if not url_line:
        return None
    
    # Skip header line
    if url_line.lower() in ['instance name', 'url', 'domain']:
        return None
    
    # If URL doesn't start with http:// or https://, add https://
    if not url_line.startswith(('http://', 'https://')):
        url_line = f'https://{url_line}'
    
    return url_line


def check_url(url):
    """
    Check if a Kayako URL is active and if it shows the unavailable message.
    Returns tuple: (url, status, http_code, error_message)
    Status can be: 'Active Kayako', 'Instance unavailable', or error status
    """
    original_url = url
    normalized_url = normalize_url(url)
    
    if not normalized_url:
        return (original_url, 'Skipped', 'N/A', 'Empty or header line')
    
    # Wait for rate limit to avoid overwhelming servers
    wait_for_rate_limit()
    
    try:
        # Make GET request to get page content
        response = requests.get(
            normalized_url,
            timeout=TIMEOUT,
            allow_redirects=True,
            verify=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        http_code = response.status_code
        
        # Check if we got a successful response
        if 200 <= http_code < 400:
            # Get page content
            page_content = response.text
            
            # Check if the error message is present
            if KAYAKO_ERROR_MESSAGE.lower() in page_content.lower():
                return (original_url, 'Instance unavailable', http_code, KAYAKO_ERROR_MESSAGE)
            else:
                return (original_url, 'Active Kayako', http_code, '')
        else:
            return (original_url, 'Inactive', http_code, f'HTTP {http_code}')
            
    except requests.exceptions.Timeout:
        return (original_url, 'Inactive', 'Timeout', 'Request timeout')
    except requests.exceptions.ConnectionError as e:
        error_msg = str(e)
        if 'SSL' in error_msg or 'certificate' in error_msg.lower():
            return (original_url, 'Inactive', 'SSL Error', 'SSL/Certificate error')
        elif 'Name or service not known' in error_msg or 'nodename nor servname' in error_msg:
            return (original_url, 'Inactive', 'DNS Error', 'DNS resolution failed')
        else:
            return (original_url, 'Inactive', 'Connection Error', 'Connection failed')
    except requests.exceptions.TooManyRedirects:
        return (original_url, 'Inactive', 'Redirect Error', 'Too many redirects')
    except requests.exceptions.RequestException as e:
        return (original_url, 'Inactive', 'Request Error', str(e)[:100])
    except Exception as e:
        return (original_url, 'Inactive', 'Unknown Error', str(e)[:100])


def read_urls_from_file(filename):
    """Read URLs from file, one per line. Skip header line."""
    urls = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            # Skip first line if it's a header
            start_idx = 0
            if lines and lines[0].strip().lower() in ['instance name', 'url', 'domain']:
                start_idx = 1
            
            for line in lines[start_idx:]:
                url = line.strip()
                if url:  # Skip empty lines
                    urls.append(url)
        return urls
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)


def main():
    print("=" * 60)
    print("Kayako URL Checker Tool")
    print("=" * 60)
    print(f"Reading URLs from: {INPUT_FILE}")
    
    # Read URLs
    urls = read_urls_from_file(INPUT_FILE)
    total_urls = len(urls)
    print(f"Found {total_urls} URLs to check")
    print(f"Using {MAX_WORKERS} concurrent workers")
    print(f"Timeout per request: {TIMEOUT} seconds")
    print(f"Delay between requests: {REQUEST_DELAY} seconds")
    print("-" * 60)
    
    # Prepare CSV output
    results = []
    start_time = time.time()
    
    # Process URLs with threading
    print("Checking URLs...")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        future_to_url = {executor.submit(check_url, url): url for url in urls}
        
        # Process completed tasks
        completed = 0
        for future in as_completed(future_to_url):
            result = future.result()
            results.append(result)
            completed += 1
            
            # Progress update every 100 URLs
            if completed % 100 == 0 or completed == total_urls:
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                remaining = total_urls - completed
                eta = remaining / rate if rate > 0 else 0
                print(f"Progress: {completed}/{total_urls} ({completed*100/total_urls:.1f}%) | "
                      f"Rate: {rate:.1f} URLs/sec | ETA: {eta:.0f}s")
                
                # Add a brief pause every 100 URLs to give servers a break
                if completed < total_urls and completed % 100 == 0:
                    time.sleep(2)  # 2 second pause every 100 URLs
    
    elapsed_time = time.time() - start_time
    
    # Write results to CSV
    print("-" * 60)
    print(f"Writing results to: {OUTPUT_FILE}")
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # Write header
        writer.writerow(['URL', 'Status', 'HTTP Code', 'Error Message'])
        # Write results
        writer.writerows(results)
    
    # Print summary
    active_count = sum(1 for r in results if r[1] == 'Active Kayako')
    unavailable_count = sum(1 for r in results if r[1] == 'Instance unavailable')
    inactive_count = sum(1 for r in results if r[1] == 'Inactive')
    skipped_count = sum(1 for r in results if r[1] == 'Skipped')
    
    print("-" * 60)
    print("Summary:")
    print(f"  Total URLs checked: {total_urls}")
    print(f"  Active Kayako: {active_count}")
    print(f"  Instance unavailable: {unavailable_count}")
    print(f"  Inactive URLs: {inactive_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Time taken: {elapsed_time:.2f} seconds")
    if elapsed_time > 0:
        print(f"  Average rate: {total_urls/elapsed_time:.2f} URLs/second")
    print(f"  Results saved to: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == '__main__':
    main()

