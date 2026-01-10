import gzip

filename = 'db_cluster-16-07-2025@13-32-15.backup.gz'

with gzip.open(filename, 'rt', encoding='utf-8', errors='ignore') as f:
    for i, line in enumerate(f):
        if line.startswith('\\connect'):
            print(f'{i}: {line.strip()}')
