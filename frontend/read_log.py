try:
    with open('debug.log', 'r', encoding='utf-16') as f:
        print(f.read())
except UnicodeError:
    try:
        with open('test_output.log', 'r', encoding='utf-8') as f:
            print(f.read())
    except Exception as e:
        print(f"Error reading utf-8: {e}")
except Exception as e:
    print(f"Error reading utf-16: {e}")
