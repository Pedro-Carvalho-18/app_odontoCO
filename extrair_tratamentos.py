import re
import csv

def deep_scan_treatments():
    print("Iniciando busca heurística por tratamentos e observações...")
    
    # Lista de termos comuns em prontuários odontológicos para busca binária
    keywords = [
        rb'Limpeza', rb'Profilaxia', rb'Restauracao', rb'Resina', rb'Canal', 
        rb'Extracao', rb'Siso', rb'Implante', rb'Coroa', rb'Protese',
        rb'Ortodontia', rb'Aparelho', rb'Raspagem', rb'Fluor', rb'Cirurgia',
        rb'Ponte', rb'Endodontia', rb'Periodontia', rb'Avaliacao', rb'Orcamento'
    ]
    
    # Regex para capturar frases que parecem observações clínicas
    # Procura por sequências de texto legível (letras, números e espaços) de 20 a 200 caracteres
    # Geralmente observações terminam em ponto ou quebra de linha binária
    clinical_note_pattern = re.compile(rb'[A-Z][a-zA-Z0-9\s\.,]{20,200}')

    results = []
    
    try:
        with open('database/source_files/eds80dat.mdf', 'rb') as f:
            data = f.read()
            
            print("Escaneando por termos técnicos...")
            for kw in keywords:
                matches = re.finditer(kw, data, re.IGNORECASE)
                count = 0
                for match in matches:
                    # Pega o contexto ao redor do termo (100 bytes antes e depois)
                    start = max(0, match.start() - 50)
                    end = min(len(data), match.end() + 150)
                    context = data[start:end].decode('latin1', errors='ignore')
                    # Limpa caracteres não imprimíveis
                    clean_context = "".join(c for c in context if c.isprintable()).strip()
                    
                    if len(clean_context) > 15:
                        results.append({
                            'termo_encontrado': kw.decode(),
                            'contexto_clinico': clean_context
                        })
                        count += 1
                    
                    if count > 500: break # Limite por termo
                print(f"  - {kw.decode()}: {count} ocorrências")

            print("Escaneando por blocos de notas clínicas...")
            notes = clinical_note_pattern.findall(data)
            note_count = 0
            for note in notes:
                clean_note = note.decode('latin1', errors='ignore').strip()
                # Filtra se parece código de sistema ou lixo
                if len(clean_note) > 30 and '  ' not in clean_note[:20]:
                    results.append({
                        'termo_encontrado': 'NOTA_CLINICA',
                        'contexto_clinico': clean_note
                    })
                    note_count += 1
                if note_count > 2000: break
            print(f"  - Notas clínicas potenciais: {note_count}")

        # Salvar resultados
        if results:
            with open('database/tratamentos_extraidos.csv', 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['termo_encontrado', 'contexto_clinico'])
                writer.writeheader()
                writer.writerows(results)
            print(f"\nSucesso! {len(results)} fragmentos de tratamento salvos em DataBase/tratamentos_extraidos.csv")
        else:
            print("\nNenhum fragmento de tratamento claro foi identificado.")

    except Exception as e:
        print(f"Erro na extração: {e}")

if __name__ == "__main__":
    deep_scan_treatments()
