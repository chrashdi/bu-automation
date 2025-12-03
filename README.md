# URL Checker Tool

A Python tool that checks if URLs from a list are active or inactive, and outputs the results to a CSV file.

## Features

- ✅ Reads URLs from `url-list.md` (one URL per line)
- ✅ Automatically adds `https://` protocol if missing
- ✅ Checks URL status with HTTP requests
- ✅ Handles various error types (timeouts, SSL errors, DNS errors, etc.)
- ✅ Uses concurrent processing for fast checking (50 workers by default)
- ✅ Shows progress updates during execution
- ✅ Outputs results to CSV with detailed status information

## Installation

1. Install Python 3.7 or higher
2. Install required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. Make sure `url-list.md` is in the same directory
2. Run the script:

```bash
python url_checker.py
```

The script will:
- Read all URLs from `url-list.md`
- Check each URL's status
- Save results to `url_check_results.csv`

## Output Format

The CSV file contains the following columns:

- **URL**: The original URL from the input file
- **Status**: Either "Active" or "Inactive"
- **HTTP Code**: The HTTP status code (e.g., 200, 404, 500) or error type
- **Error Message**: Brief description of any errors encountered

### Status Codes

- **Active**: HTTP status codes 200-399 (successful responses and redirects)
- **Inactive**: HTTP status codes 400+ or connection errors

### Error Types

- `Timeout`: Request took too long (>10 seconds)
- `SSL Error`: SSL certificate issues
- `DNS Error`: Domain name resolution failed
- `Connection Error`: Could not connect to the server
- `Redirect Error`: Too many redirects
- `Request Error`: Other request-related errors

## Configuration

You can modify these settings in `url_checker.py`:

- `TIMEOUT`: Request timeout in seconds (default: 10)
- `MAX_WORKERS`: Number of concurrent requests (default: 50)
- `INPUT_FILE`: Input file name (default: 'url-list.md')
- `OUTPUT_FILE`: Output CSV file name (default: 'url_check_results.csv')

## Performance

For ~14,653 URLs:
- Estimated time: ~5-10 minutes (depending on network speed and server response times)
- Processing rate: ~25-50 URLs/second

## Example Output

```csv
URL,Status,HTTP Code,Error Message
https://example.com,Active,200,
https://invalid-domain-12345.com,Inactive,DNS Error,DNS resolution failed
https://httpstat.us/500,Inactive,500,HTTP 500
```

