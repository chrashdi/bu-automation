#!/usr/bin/env python3
"""
URL Status Checker
Reads URLs from URL-dxi-legacy.yaml and checks their status.
Identifies specific error messages and DNS issues.
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
import socket

# Configuration
TIMEOUT = 15  # seconds
MAX_WORKERS = 20  # Number of concurrent requests
REQUEST_DELAY = 0.3  # seconds - delay between requests
INPUT_FILE = 'eol-sentinel/URL-dxi-legacy.yaml'
OUTPUT_FILE = 'url_status_results.csv'

# Error messages to check for
ERROR_MESSAGE_OOPS = "Oops, something has gone wrong. Please try again later while we try and fix this."
DNS_ERROR_INDICATORS = ["DNS_PROBE_FINISHED_NXDOMAIN", "Name or service not known", "nodename nor servname"]

# Rate limiter to space out requests
rate_limiter_lock = threading.Lock()
last_request_time = [0]


def wait_for_rate_limit():
    """Ensure minimum delay between requests."""
    with rate_limiter_lock:
        current_time = time.time()
        time_since_last = current_time - last_request_time[0]
        if time_since_last < REQUEST_DELAY:
            sleep_time = REQUEST_DELAY - time_since_last
            time.sleep(sleep_time)
        last_request_time[0] = time.time()


def check_dns(url):
    """Check if DNS resolution works for the URL."""
    try:
        parsed = urlparse(url)
        hostname = parsed.netloc or parsed.path.split('/')[0]
        # Remove port if present
        hostname = hostname.split(':')[0]
        socket.gethostbyname(hostname)
        return True, None
    except socket.gaierror as e:
        return False, f"DNS Error: {str(e)}"
    except Exception as e:
        return None, f"DNS Check Error: {str(e)}"


def check_url(url):
    """
    Check URL status and identify specific error types.
    Returns tuple: (url, status, http_code, error_message, error_type)
    """
    original_url = url.strip()
    
    # Skip empty lines and header
    if not original_url or original_url.lower() == 'url':
        return (original_url, 'Skipped', 'N/A', 'Empty or header line', 'N/A')
    
    # Clean up URL - remove comments
    if '#' in original_url:
        original_url = original_url.split('#')[0].strip()
    
    # Normalize URL - ensure it has a protocol
    normalized_url = original_url
    if not normalized_url.startswith(('http://', 'https://')):
        normalized_url = f'https://{normalized_url}'
    
    # Wait for rate limit
    wait_for_rate_limit()
    
    # First check DNS
    dns_works, dns_error = check_dns(normalized_url)
    if dns_works is False:
        return (original_url, 'DNS Error', 'N/A', dns_error or 'DNS_PROBE_FINISHED_NXDOMAIN', 'DNS Error')
    
    try:
        # Make GET request
        response = requests.get(
            normalized_url,
            timeout=TIMEOUT,
            allow_redirects=True,
            verify=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        http_code = response.status_code
        
        # Get page content
        page_content = response.text.lower()
        
        # Check for specific error messages
        if ERROR_MESSAGE_OOPS.lower() in page_content:
            return (original_url, 'Error Page', http_code, ERROR_MESSAGE_OOPS, 'Application Error')
        
        # Check for other common error indicators
        if 'this site can\'t be reached' in page_content or 'site can\'t be reached' in page_content:
            return (original_url, 'Site Unreachable', http_code, 'Site can\'t be reached', 'Connection Error')
        
        # Successful response
        if 200 <= http_code < 400:
            return (original_url, 'Working', http_code, '', 'Success')
        elif http_code >= 400:
            return (original_url, f'HTTP {http_code}', http_code, f'HTTP Error {http_code}', 'HTTP Error')
        else:
            return (original_url, 'Unknown Status', http_code, f'Unexpected status code: {http_code}', 'Unknown')
            
    except requests.exceptions.Timeout:
        return (original_url, 'Timeout', 'Timeout', 'Request timeout - site did not respond', 'Timeout')
    except requests.exceptions.SSLError as e:
        return (original_url, 'SSL Error', 'SSL Error', f'SSL Certificate error: {str(e)[:100]}', 'SSL Error')
    except requests.exceptions.ConnectionError as e:
        error_msg = str(e).lower()
        if 'name or service not known' in error_msg or 'nodename nor servname' in error_msg:
            return (original_url, 'DNS Error', 'DNS Error', 'DNS_PROBE_FINISHED_NXDOMAIN', 'DNS Error')
        elif 'refused' in error_msg:
            return (original_url, 'Connection Refused', 'Connection Error', 'Connection refused - site not responding', 'Connection Error')
        else:
            return (original_url, 'Connection Error', 'Connection Error', f'Connection failed: {str(e)[:100]}', 'Connection Error')
    except requests.exceptions.TooManyRedirects:
        return (original_url, 'Redirect Error', 'Redirect Error', 'Too many redirects', 'Redirect Error')
    except requests.exceptions.RequestException as e:
        return (original_url, 'Request Error', 'Request Error', str(e)[:150], 'Request Error')
    except Exception as e:
        return (original_url, 'Unknown Error', 'Unknown Error', str(e)[:150], 'Unknown Error')


def read_urls_from_file(filename):
    """Read URLs from file, one per line. Skip header line and empty lines."""
    urls = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                url = line.strip()
                # Skip empty lines and header
                if url and url.lower() != 'url':
                    urls.append(url)
        return urls
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)


def main():
    print("=" * 70)
    print("URL Status Checker")
    print("=" * 70)
    print(f"Reading URLs from: {INPUT_FILE}")
    
    # Read URLs
    urls = read_urls_from_file(INPUT_FILE)
    total_urls = len(urls)
    print(f"Found {total_urls} URLs to check")
    print(f"Using {MAX_WORKERS} concurrent workers")
    print(f"Timeout per request: {TIMEOUT} seconds")
    print(f"Delay between requests: {REQUEST_DELAY} seconds")
    print("-" * 70)
    
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
            
            # Progress update every 50 URLs
            if completed % 50 == 0 or completed == total_urls:
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                remaining = total_urls - completed
                eta = remaining / rate if rate > 0 else 0
                print(f"Progress: {completed}/{total_urls} ({completed*100/total_urls:.1f}%) | "
                      f"Rate: {rate:.1f} URLs/sec | ETA: {eta:.0f}s")
                
                # Add a brief pause every 100 URLs
                if completed < total_urls and completed % 100 == 0:
                    time.sleep(1)
    
    elapsed_time = time.time() - start_time
    
    # Write results to CSV
    print("-" * 70)
    print(f"Writing results to: {OUTPUT_FILE}")
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # Write header
        writer.writerow(['URL', 'Status', 'HTTP Code', 'Error Message', 'Error Type'])
        # Write results
        writer.writerows(results)
    
    # Print summary
    working_count = sum(1 for r in results if r[1] == 'Working')
    error_page_count = sum(1 for r in results if r[1] == 'Error Page')
    dns_error_count = sum(1 for r in results if 'DNS' in r[1] or 'DNS' in r[4])
    timeout_count = sum(1 for r in results if r[1] == 'Timeout')
    connection_error_count = sum(1 for r in results if 'Connection' in r[1] or 'Connection' in r[4])
    http_error_count = sum(1 for r in results if 'HTTP' in r[1] and r[1] != 'Working')
    skipped_count = sum(1 for r in results if r[1] == 'Skipped')
    other_count = total_urls - working_count - error_page_count - dns_error_count - timeout_count - connection_error_count - http_error_count - skipped_count
    
    print("-" * 70)
    print("Summary:")
    print(f"  Total URLs checked: {total_urls}")
    print(f"  ✓ Working: {working_count}")
    print(f"  ✗ Error Page (Oops message): {error_page_count}")
    print(f"  ✗ DNS Errors: {dns_error_count}")
    print(f"  ✗ Timeout: {timeout_count}")
    print(f"  ✗ Connection Errors: {connection_error_count}")
    print(f"  ✗ HTTP Errors: {http_error_count}")
    print(f"  - Skipped: {skipped_count}")
    print(f"  ? Other: {other_count}")
    print(f"  Time taken: {elapsed_time:.2f} seconds")
    if elapsed_time > 0:
        print(f"  Average rate: {total_urls/elapsed_time:.2f} URLs/second")
    print(f"  Results saved to: {OUTPUT_FILE}")
    print("=" * 70)


if __name__ == '__main__':
    main()

