import pandas as pd
import re

df = pd.read_csv(r'e:\TCG Web App\Documentación\catalogo_formateado_para_importar.csv')

# Fix character issue
df['name'] = df['name'].str.replace('duelists', "duelist's", regex=False)
# If there are any literal replacement characters left, replace with apostrophe
df['name'] = df['name'].str.replace('\ufffd', "'", regex=False)

# Improve categorization
def update_category(row):
    if row['category_code'] not in ['OTHER']:
        return row['category_code']
        
    name = str(row['name']).lower()
    
    if 'booster' in name and 'box' not in name and 'display' not in name:
        return 'BOOSTER_PACK'
    
    if ' ex box' in name or ' v box' in name or ' vstar box' in name or ' vmax box' in name:
        return 'SPECIAL_SET'
        
    return row['category_code']

df['category_code'] = df.apply(update_category, axis=1)

output_path = r'e:\TCG Web App\Documentación\catalogo_formateado_para_importar.csv'
df.to_csv(output_path, index=False, encoding='utf-8-sig')
print('Nuevas mejoras aplicadas.')
