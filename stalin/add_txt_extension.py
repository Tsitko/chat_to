#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для добавления расширения .txt всем файлам без расширения
"""

import os
import sys
from pathlib import Path


def has_extension(filename):
    """Проверяет, есть ли у файла расширение"""
    return '.' in filename and not filename.startswith('.')


def add_txt_extension(root_dir='.'):
    """
    Рекурсивно проходит по всем папкам и добавляет .txt к файлам без расширения
    
    Args:
        root_dir: Корневая директория для поиска (по умолчанию текущая)
    """
    root_path = Path(root_dir).resolve()
    renamed_count = 0
    error_count = 0
    
    print(f"Поиск файлов без расширения в: {root_path}")
    print("-" * 60)
    
    # Рекурсивно проходим по всем файлам
    for file_path in root_path.rglob('*'):
        # Пропускаем директории
        if file_path.is_dir():
            continue
        
        # Пропускаем файлы, которые уже имеют расширение
        if has_extension(file_path.name):
            continue
        
        # Пропускаем скрытые файлы (начинающиеся с точки)
        if file_path.name.startswith('.'):
            continue
        
        # Пропускаем сам скрипт
        if file_path.name == 'add_txt_extension.py':
            continue
        
        # Формируем новое имя с расширением .txt
        new_path = file_path.with_suffix('.txt')
        
        try:
            # Проверяем, не существует ли уже файл с таким именем
            if new_path.exists():
                print(f"⚠ Пропущен: {file_path.relative_to(root_path)} (файл {new_path.name} уже существует)")
                error_count += 1
                continue
            
            # Переименовываем файл
            file_path.rename(new_path)
            print(f"✓ Переименован: {file_path.relative_to(root_path)} -> {new_path.name}")
            renamed_count += 1
            
        except Exception as e:
            print(f"✗ Ошибка при переименовании {file_path.relative_to(root_path)}: {e}")
            error_count += 1
    
    print("-" * 60)
    print(f"Готово! Переименовано файлов: {renamed_count}")
    if error_count > 0:
        print(f"Ошибок/пропущено: {error_count}")
    
    return renamed_count, error_count


if __name__ == '__main__':
    # Можно указать директорию как аргумент командной строки
    target_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    try:
        renamed, errors = add_txt_extension(target_dir)
        sys.exit(0 if errors == 0 else 1)
    except KeyboardInterrupt:
        print("\n\nПрервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\nКритическая ошибка: {e}")
        sys.exit(1)

