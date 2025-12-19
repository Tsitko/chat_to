#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для объединения всех .txt файлов из папок volume_* в один файл
"""

import os
import re
import sys
from pathlib import Path


def extract_volume_number(volume_dir):
    """Извлекает номер тома из имени папки volume_X"""
    match = re.search(r'volume_(\d+)', volume_dir.name, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 0


def extract_file_number(filename):
    """Извлекает номер из имени файла (например, '123.txt' -> 123)"""
    # Убираем расширение
    name_without_ext = filename.replace('.txt', '')
    try:
        return int(name_without_ext)
    except ValueError:
        return 0


def get_all_txt_files(root_dir='.'):
    """
    Находит все .txt файлы в папках volume_* и возвращает отсортированный список
    
    Args:
        root_dir: Корневая директория для поиска
        
    Returns:
        Список кортежей (volume_number, file_number, file_path)
    """
    root_path = Path(root_dir).resolve()
    files_list = []
    
    # Ищем все папки volume_*
    for volume_dir in root_path.iterdir():
        if not volume_dir.is_dir():
            continue
        
        if not re.match(r'volume_\d+', volume_dir.name, re.IGNORECASE):
            continue
        
        volume_number = extract_volume_number(volume_dir)
        
        # Ищем все .txt файлы в папке
        for txt_file in volume_dir.glob('*.txt'):
            if txt_file.is_file():
                file_number = extract_file_number(txt_file.name)
                files_list.append((volume_number, file_number, txt_file))
    
    # Сортируем: сначала по номеру тома, затем по номеру файла
    files_list.sort(key=lambda x: (x[0], x[1]))
    
    return files_list


def merge_txt_files(root_dir='.', output_filename='all_merged.txt', add_separators=True):
    """
    Объединяет все .txt файлы из папок volume_* в один файл
    
    Args:
        root_dir: Корневая директория для поиска
        output_filename: Имя выходного файла
        add_separators: Добавлять ли разделители между файлами
    """
    root_path = Path(root_dir).resolve()
    output_path = root_path / output_filename
    
    print(f"Поиск .txt файлов в папках volume_* в: {root_path}")
    print("-" * 60)
    
    # Получаем отсортированный список файлов
    files_list = get_all_txt_files(root_dir)
    
    if not files_list:
        print("Не найдено .txt файлов в папках volume_*")
        return
    
    print(f"Найдено файлов: {len(files_list)}")
    print(f"Запись в файл: {output_path.name}")
    print("-" * 60)
    
    total_size = 0
    processed = 0
    
    try:
        with open(output_path, 'w', encoding='utf-8') as output_file:
            for volume_num, file_num, file_path in files_list:
                try:
                    # Добавляем разделитель перед каждым файлом (кроме первого)
                    if add_separators and processed > 0:
                        output_file.write('\n' + '=' * 80 + '\n')
                        output_file.write(f"Volume: {volume_num}, File: {file_num}\n")
                        output_file.write('=' * 80 + '\n\n')
                    
                    # Читаем и записываем содержимое файла
                    with open(file_path, 'r', encoding='utf-8') as input_file:
                        content = input_file.read()
                        output_file.write(content)
                        
                        # Добавляем перенос строки в конце, если его нет
                        if content and not content.endswith('\n'):
                            output_file.write('\n')
                    
                    file_size = file_path.stat().st_size
                    total_size += file_size
                    processed += 1
                    
                    # Показываем прогресс каждые 100 файлов
                    if processed % 100 == 0:
                        print(f"Обработано: {processed}/{len(files_list)} файлов...")
                    
                except Exception as e:
                    print(f"⚠ Ошибка при обработке {file_path.relative_to(root_path)}: {e}")
                    continue
        
        print("-" * 60)
        print(f"Готово!")
        print(f"Обработано файлов: {processed}")
        print(f"Общий размер выходного файла: {total_size / 1024 / 1024:.2f} MB")
        print(f"Выходной файл: {output_path}")
        
    except Exception as e:
        print(f"✗ Критическая ошибка при создании выходного файла: {e}")
        raise


if __name__ == '__main__':
    # Можно указать директорию и имя выходного файла как аргументы
    target_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    output_name = sys.argv[2] if len(sys.argv) > 2 else 'all_merged.txt'
    
    try:
        merge_txt_files(target_dir, output_name)
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\nПрервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\nКритическая ошибка: {e}")
        sys.exit(1)

