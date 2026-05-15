import re
import csv
import os

def exhaustive_scrape(mdf_path, output_csv):
    print(f"Iniciando extração total de texto de: {mdf_path}")
    
    # Padrões para captura exaustiva
    patterns = {
        'CPF': re.compile(rb'\d{3}\.\d{3}\.\d{3}-\d{2}'),
        'DATA': re.compile(rb'\d{2}/\d{2}/\d{4}'),
        'EMAIL': re.compile(rb'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}'),
        'TELEFONE': re.compile(rb'\(\d{2}\)\s\d{4,5}-\d{4}'),
        'NOME_PROPRIO': re.compile(rb'\x00([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\x00'),
        'TEXTO_LONGO': re.compile(rb'[A-Z][a-zA-Z0-9\s\.,\-\/]{25,250}')
    }

    results = []
    seen = set()

    try:
        # Lendo o arquivo inteiro (200MB cabe na RAM da maioria das máquinas modernas)
        with open(mdf_path, 'rb') as f:
            data = f.read()

        for label, pattern in patterns.items():
            print(f"Buscando {label}...")
            matches = pattern.findall(data)
            count = 0
            for m in matches:
                try:
                    # Se o pattern tiver grupo de captura (como NOME_PROPRIO), m será o grupo
                    val = m.decode('latin1').strip()
                    if val not in seen and len(val) > 3:
                        results.append({'tipo': label, 'conteudo': val})
                        seen.add(val)
                        count += 1
                except:
                    continue
            print(f"  - Encontrados: {count}")

        if results:
            with open(output_csv, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['tipo', 'conteudo'])
                writer.writeheader()
                writer.writerows(results)
            print(f"\nSucesso! {len(results)} registros únicos extraídos para {output_csv}")
        else:
            print("\nNenhum dado encontrado.")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    mdf = 'database/source_files/eds80dat.mdf'
    out = 'database/extracao_total.csv'
    if os.path.exists(mdf):
        exhaustive_scrape(mdf, out)
    else:
        print("Arquivo MDF não encontrado.")
