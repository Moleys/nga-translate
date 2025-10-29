# Chinese to Vietnamese Translator API

A high-performance Go web service for translating Chinese text to Sino-Vietnamese (Hán Việt).

## Features

- **Fast Translation**: Trie-based dictionary lookup with 897,725+ entries
- **Multiple Endpoints**: `/translate`, `/translate2`, `/translate3` compatible with Microsoft Translator API format  
- **Complete Character Support**: Handles Traditional/Simplified Chinese conversion and special characters
- **Memory Efficient**: Chunked processing for large texts
- **Production Ready**: Docker containerized with proper error handling

## Quick Start

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t vietnamese-translator .
docker run -p 5005:5005 vietnamese-translator
```

### Manual Build

```bash
# Install dependencies
go mod download

# Run the server
go run main.go
```

## API Usage

### POST /translate
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"你好世界"}' \
  http://localhost:5005/translate
```
Response: `{"translatedText":"ngươi tốt thế giới"}`

### POST /translate2  
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '[{"text":"你好世界"}]' \
  http://localhost:5005/translate2
```

### GET /translate3
```bash
curl "http://localhost:5005/translate3?q=你好世界"
```

## Performance

- **Dictionary Size**: 897,725 entries loaded from 4 optimized files
- **Memory Usage**: ~100MB for full dictionary in memory
- **Response Time**: <50ms for typical sentences
- **Chunked Processing**: 1000 character chunks for optimal performance

## Architecture

```
├── main.go              # Main server and translation logic
├── data/               # Dictionary files
│   ├── Names2.txt      # High-priority names (87 entries)
│   ├── Names.txt       # Standard names (0 entries) 
│   ├── VietPhrase.txt  # Vietnamese phrases (880,451 entries)
│   └── ChinesePhienAmWords.txt  # Fallback characters (17,187 entries)
├── Dockerfile          # Container configuration
└── docker-compose.yml  # Service orchestration
```

## Translation Pipeline

1. **Special Characters**: Convert Unicode punctuation (：→:, 。→., etc.)
2. **Chinese Conversion**: Traditional → Simplified Chinese
3. **Dictionary Lookup**: Priority-based Trie search (Names2 → Names → VietPhrase → ChinesePhienAm)
4. **Chunked Processing**: Process large texts in 1000-character chunks
5. **Rephrase**: Apply Vietnamese spacing and punctuation rules

## Production Notes

- **CORS Enabled**: Allows cross-origin requests
- **Error Handling**: JSON error responses with proper HTTP status codes  
- **Logging**: Dictionary loading statistics on startup
- **Health Check**: Server startup confirmation on port 5005

## License

MIT License - Free for commercial and personal use.