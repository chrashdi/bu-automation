#!/usr/bin/env python3
"""
Retest URLs that timed out with a longer timeout to get definitive error codes.
"""

import csv
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import sys

# Configuration
TIMEOUT = 30  # Longer timeout: 30 seconds
MAX_WORKERS = 20  # Fewer workers for more thorough checking
INPUT_CSV = 'url_check_results.csv'
OUTPUT_CSV = 'url_check_results_updated.csv'


def normalize_url(url_line):
    """Normalize URL by adding https:// if protocol is missing."""
    url_line = url_line.strip()
    if not url_line:
        return None
    
    # If URL doesn't start with http:// or https://, add https://
    if not url_line.startswith(('http://', 'https://')):
        url_line = f'https://{url_line}'
    
    return url_line


def check_url_with_retry(url):
    """
    Check if a URL is active with longer timeout and retry logic.
    Returns tuple: (url, status, http_code, error_message)
    """
    original_url = url
    normalized_url = normalize_url(url)
    
    if not normalized_url:
        return (original_url, 'Inactive', 'N/A', 'Empty URL')
    
    # Try HEAD first, then GET if HEAD fails
    for method in ['HEAD', 'GET']:
        try:
            if method == 'HEAD':
                response = requests.head(
                    normalized_url,
                    timeout=TIMEOUT,
                    allow_redirects=True,
                    verify=True
                )
            else:
                response = requests.get(
                    normalized_url,
                    timeout=TIMEOUT,
                    allow_redirects=True,
                    verify=True,
                    stream=True  # Don't download full content
                )
            
            http_code = response.status_code
            
            # Consider 2xx and 3xx as active
            if 200 <= http_code < 400:
                return (original_url, 'Active', http_code, '')
            else:
                return (original_url, 'Inactive', http_code, f'HTTP {http_code}')
                
        except requests.exceptions.Timeout:
            # If timeout, try GET method if we were using HEAD
            if method == 'HEAD':
                continue
            return (original_url, 'Inactive', 'Timeout', f'Request timeout after {TIMEOUT}s')
        except requests.exceptions.ConnectionError as e:
            error_msg = str(e)
            if 'SSL' in error_msg or 'certificate' in error_msg.lower():
                return (original_url, 'Inactive', 'SSL Error', 'SSL/Certificate error')
            elif 'Name or service not known' in error_msg or 'nodename nor servname' in error_msg:
                return (original_url, 'Inactive', 'DNS Error', 'DNS resolution failed')
            elif 'Connection refused' in error_msg or 'refused' in error_msg.lower():
                return (original_url, 'Inactive', 'Connection Refused', 'Connection refused by server')
            else:
                return (original_url, 'Inactive', 'Connection Error', 'Connection failed')
        except requests.exceptions.TooManyRedirects:
            return (original_url, 'Inactive', 'Redirect Error', 'Too many redirects')
        except requests.exceptions.SSLError as e:
            return (original_url, 'Inactive', 'SSL Error', f'SSL error: {str(e)[:100]}')
        except requests.exceptions.RequestException as e:
            return (original_url, 'Inactive', 'Request Error', str(e)[:100])
        except Exception as e:
            return (original_url, 'Inactive', 'Unknown Error', str(e)[:100])
    
    # If both methods failed with timeout
    return (original_url, 'Inactive', 'Timeout', f'Request timeout after {TIMEOUT}s')


def read_csv_and_find_timeouts(filename):
    """Read CSV and find URLs with Timeout errors."""
    timeout_urls = []
    all_rows = []
    
    try:
        with open(filename, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                all_rows.append(row)
                if row['HTTP Code'] == 'Timeout':
                    timeout_urls.append(row['URL'])
        return timeout_urls, all_rows
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        sys.exit(1)


def main():
    print("=" * 60)
    print("Retest Timeout URLs Tool")
    print("=" * 60)
    print(f"Reading CSV: {INPUT_CSV}")
    
    # Read CSV and find timeout URLs
    timeout_urls, all_rows = read_csv_and_find_timeouts(INPUT_CSV)
    total_timeouts = len(timeout_urls)
    
    print(f"Found {total_timeouts} URLs with Timeout errors")
    print(f"Using {MAX_WORKERS} concurrent workers")
    print(f"Timeout per request: {TIMEOUT} seconds")
    print("-" * 60)
    
    if total_timeouts == 0:
        print("No timeout URLs found. Nothing to retest.")
        return
    
    # Create a dictionary to store updated results
    updated_results = {}
    
    # Retest timeout URLs
    print("Retesting timeout URLs...")
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all tasks
        future_to_url = {executor.submit(check_url_with_retry, url): url for url in timeout_urls}
        
        # Process completed tasks
        completed = 0
        for future in as_completed(future_to_url):
            result = future.result()
            updated_results[result[0]] = result
            completed += 1
            
            # Progress update every 50 URLs
            if completed % 50 == 0 or completed == total_timeouts:
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                remaining = total_timeouts - completed
                eta = remaining / rate if rate > 0 else 0
                print(f"Progress: {completed}/{total_timeouts} ({completed*100/total_timeouts:.1f}%) | "
                      f"Rate: {rate:.1f} URLs/sec | ETA: {eta:.0f}s")
    
    elapsed_time = time.time() - start_time
    
    # Update all rows with new results
    print("-" * 60)
    print("Updating CSV with new results...")
    
    updated_count = 0
    for row in all_rows:
        if row['URL'] in updated_results:
            result = updated_results[row['URL']]
            row['Status'] = result[1]
            row['HTTP Code'] = result[2]
            row['Error Message'] = result[3]
            updated_count += 1
    
    # Write updated CSV
    print(f"Writing updated results to: {OUTPUT_CSV}")
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['URL', 'Status', 'HTTP Code', 'Error Message']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)
    
    # Print summary
    still_timeout = sum(1 for url in timeout_urls 
                       if updated_results.get(url, ('', '', 'Timeout', ''))[2] == 'Timeout')
    resolved = total_timeouts - still_timeout
    
    print("-" * 60)
    print("Summary:")
    print(f"  URLs retested: {total_timeouts}")
    print(f"  Resolved (got definitive code): {resolved}")
    print(f"  Still timing out: {still_timeout}")
    print(f"  Time taken: {elapsed_time:.2f} seconds")
    print(f"  Updated CSV saved to: {OUTPUT_CSV}")
    print("=" * 60)


if __name__ == '__main__':
    main()

