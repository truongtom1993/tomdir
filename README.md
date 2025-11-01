# TomDir - CLI Directory Structure Tool

CLI tool để in ra cây thư mục với hỗ trợ gitignore.

## Cài đặt

```bash
npm install -g tomdir
```

## Sử dụng

### In cây thư mục hiện tại
```bash
tomdir
```

### In cây thư mục cụ thể
```bash
tomdir /path/to/directory
```

### Bỏ qua gitignore (hiển thị tất cả file)
```bash
tomdir -i
tomdir -i /path/to/directory
```

## Tính năng

### 1. Gitignore Support (Mặc định BẬT)
- Tự động đọc và áp dụng rules từ `.gitignore_global` (trong home directory)
- Tự động đọc và áp dụng rules từ `.gitignore` (ở thư mục được chỉ định)
- Hỗ trợ các pattern phổ biến:
  - Exact matches: `node_modules`
  - Directory patterns: `dist/`
  - Wildcard patterns: `*.log`, `temp*`

### 2. Flag -i (Ignore gitignore)
Sử dụng flag `-i` để TẮT tính năng gitignore và hiển thị tất cả files/folders:
```bash
tomdir -i
```

### 3. Default Current Directory
Nếu không cung cấp path, tool sẽ tự động sử dụng thư mục hiện tại:
```bash
tomdir
# Tương đương với: tomdir .
```

### 4. Copy to Clipboard
Sau khi in cây thư mục, tool sẽ hỏi có muốn copy vào clipboard không.

## Ví dụ Output

```
|-- my-project/
	|-- src/
		|-- index.js
		|-- utils.js
	|-- package.json
	|-- README.md
```

## Gitignore Pattern Support

Tool hỗ trợ các loại pattern sau:
- `node_modules` - Exact folder name
- `*.log` - Wildcard extension
- `dist/` - Directory-specific
- `build` - Any file/folder named build
- `temp*` - Prefix wildcard

## Version

Current version: 1.0.6

## License

MIT