#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import sys
import json
import time
from datetime import datetime
import io

class SelfModifyingAITester:
    def __init__(self, base_url="https://53442b09-298b-49f6-b059-db71e17141a1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Tester/1.0'
        })

    def log_test(self, name, success, details=""):
        """Логирование результатов тестов"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - ПРОШЕЛ")
        else:
            print(f"❌ {name} - ПРОВАЛЕН")
        
        if details:
            print(f"   Детали: {details}")
        print()

    def test_api_endpoint(self, name, method, endpoint, expected_status=200, data=None, files=None):
        """Универсальный тестер API эндпоинтов"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=30)
            elif method == 'POST':
                if files:
                    # Для загрузки файлов убираем Content-Type заголовок
                    headers = {k: v for k, v in self.session.headers.items() if k != 'Content-Type'}
                    response = requests.post(url, files=files, headers=headers, timeout=30)
                else:
                    response = self.session.post(url, json=data, timeout=30)
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
                details = f"Статус: {response.status_code}, Ответ: {json.dumps(response_data, ensure_ascii=False)[:200]}..."
            except:
                details = f"Статус: {response.status_code}, Ответ: {response.text[:200]}..."
            
            self.log_test(name, success, details)
            return success, response_data if success else {}
            
        except Exception as e:
            self.log_test(name, False, f"Ошибка: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Тест корневого эндпоинта"""
        return self.test_api_endpoint("Корневой эндпоинт", "GET", "")

    def test_chat_functionality(self):
        """Тест функциональности чата"""
        test_messages = [
            "Привет! Как дела?",
            "Расскажи о новых технологиях",
            "Что ты можешь делать?"
        ]
        
        success_count = 0
        for i, message in enumerate(test_messages, 1):
            success, response = self.test_api_endpoint(
                f"Чат - сообщение {i}",
                "POST", 
                "chat",
                200,
                {"message": message}
            )
            if success:
                success_count += 1
                # Проверяем структуру ответа
                required_fields = ['response', 'timestamp', 'improvements', 'knowledge_gained']
                if all(field in response for field in required_fields):
                    print(f"   ✅ Структура ответа корректна")
                else:
                    print(f"   ⚠️ Отсутствуют поля в ответе: {[f for f in required_fields if f not in response]}")
            
            time.sleep(1)  # Небольшая пауза между запросами
        
        return success_count == len(test_messages)

    def test_code_analysis(self):
        """Тест анализа кода"""
        success, response = self.test_api_endpoint("Анализ кода", "GET", "analyze")
        
        if success:
            # Проверяем структуру ответа анализа
            expected_fields = ['files_analyzed', 'potential_improvements', 'patterns_found', 'suggestions']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if not missing_fields:
                print(f"   ✅ Структура анализа корректна")
                print(f"   📊 Файлов проанализировано: {response.get('files_analyzed', 0)}")
                print(f"   🔧 Найдено улучшений: {len(response.get('potential_improvements', []))}")
            else:
                print(f"   ⚠️ Отсутствуют поля: {missing_fields}")
        
        return success

    def test_apply_improvements(self):
        """Тест применения улучшений"""
        success, response = self.test_api_endpoint("Применение улучшений", "POST", "improve")
        
        if success:
            # Проверяем структуру ответа
            if 'success' in response and 'message' in response:
                print(f"   ✅ Структура ответа корректна")
                print(f"   📝 Результат: {response.get('message', 'Нет сообщения')}")
                if 'details' in response:
                    details = response['details']
                    print(f"   🔧 Применено: {len(details.get('applied', []))}")
                    print(f"   ❌ Ошибок: {len(details.get('errors', []))}")
            else:
                print(f"   ⚠️ Неожиданная структура ответа")
        
        return success

    def test_internet_search(self):
        """Тест поиска в интернете"""
        search_queries = [
            "Python новые возможности 2025",
            "JavaScript фреймворки",
            "машинное обучение"
        ]
        
        success_count = 0
        for i, query in enumerate(search_queries, 1):
            success, response = self.test_api_endpoint(
                f"Поиск в интернете - запрос {i}",
                "POST",
                "search",
                200,
                {"query": query, "max_results": 5}
            )
            
            if success:
                success_count += 1
                results = response.get('results', [])
                count = response.get('count', 0)
                print(f"   📊 Найдено результатов: {count}")
                
                # Проверяем структуру результатов
                if results and len(results) > 0:
                    first_result = results[0]
                    required_fields = ['title', 'snippet', 'timestamp']
                    if all(field in first_result for field in required_fields):
                        print(f"   ✅ Структура результатов корректна")
                    else:
                        print(f"   ⚠️ Неполная структура результатов")
            
            time.sleep(1)
        
        return success_count == len(search_queries)

    def test_file_upload(self):
        """Тест загрузки файлов"""
        # Создаем тестовый файл
        test_content = """
# Тестовый Python файл
import os
import sys

def test_function():
    print("Это тестовая функция")
    return True

class TestClass:
    def __init__(self):
        self.value = 42
    
    def get_value(self):
        return self.value

if __name__ == "__main__":
    test_function()
"""
        
        # Создаем файл в памяти
        test_file = io.BytesIO(test_content.encode('utf-8'))
        test_file.name = 'test_knowledge.py'
        
        files = {'file': ('test_knowledge.py', test_file, 'text/plain')}
        
        success, response = self.test_api_endpoint(
            "Загрузка файла знаний",
            "POST",
            "upload-knowledge",
            200,
            files=files
        )
        
        if success:
            if 'message' in response and 'knowledge_extracted' in response:
                print(f"   ✅ Файл успешно обработан")
                print(f"   📚 Извлечено знаний: {response.get('knowledge_extracted', 0)}")
            else:
                print(f"   ⚠️ Неожиданная структура ответа")
        
        return success

    def test_chat_history(self):
        """Тест получения истории чата"""
        success, response = self.test_api_endpoint("История чата", "GET", "history")
        
        if success:
            if 'messages' in response:
                messages = response['messages']
                print(f"   📊 Сообщений в истории: {len(messages)}")
                
                # Проверяем структуру сообщений
                if messages and len(messages) > 0:
                    first_message = messages[0]
                    if 'timestamp' in first_message and 'type' in first_message:
                        print(f"   ✅ Структура сообщений корректна")
                    else:
                        print(f"   ⚠️ Неполная структура сообщений")
            else:
                print(f"   ⚠️ Отсутствует поле 'messages'")
        
        return success

    def test_improvements_history(self):
        """Тест получения истории улучшений"""
        success, response = self.test_api_endpoint("История улучшений", "GET", "improvements-history")
        
        if success:
            if 'improvements' in response:
                improvements = response['improvements']
                print(f"   📊 Записей об улучшениях: {len(improvements)}")
                
                # Проверяем структуру улучшений
                if improvements and len(improvements) > 0:
                    first_improvement = improvements[0]
                    if 'timestamp' in first_improvement and 'result' in first_improvement:
                        print(f"   ✅ Структура улучшений корректна")
                    else:
                        print(f"   ⚠️ Неполная структура улучшений")
            else:
                print(f"   ⚠️ Отсутствует поле 'improvements'")
        
        return success

    def run_all_tests(self):
        """Запуск всех тестов"""
        print("🚀 Начинаю тестирование самомодифицирующегося ИИ")
        print(f"🌐 Базовый URL: {self.base_url}")
        print("=" * 60)
        
        # Тестируем все эндпоинты
        tests = [
            ("Корневой эндпоинт", self.test_root_endpoint),
            ("Функциональность чата", self.test_chat_functionality),
            ("Анализ кода", self.test_code_analysis),
            ("Применение улучшений", self.test_apply_improvements),
            ("Поиск в интернете", self.test_internet_search),
            ("Загрузка файлов", self.test_file_upload),
            ("История чата", self.test_chat_history),
            ("История улучшений", self.test_improvements_history),
        ]
        
        print("📋 Выполняю тесты API:")
        print()
        
        for test_name, test_func in tests:
            print(f"🔍 Тестирую: {test_name}")
            try:
                test_func()
            except Exception as e:
                self.log_test(test_name, False, f"Исключение: {str(e)}")
            print("-" * 40)
        
        # Итоговая статистика
        print("=" * 60)
        print("📊 ИТОГОВАЯ СТАТИСТИКА:")
        print(f"✅ Тестов пройдено: {self.tests_passed}")
        print(f"❌ Тестов провалено: {self.tests_run - self.tests_passed}")
        print(f"📈 Общий процент успеха: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
            return 0
        elif self.tests_passed / self.tests_run >= 0.7:
            print("⚠️ Большинство тестов пройдено, но есть проблемы")
            return 1
        else:
            print("🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ - много тестов провалено")
            return 2

def main():
    """Главная функция"""
    tester = SelfModifyingAITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())