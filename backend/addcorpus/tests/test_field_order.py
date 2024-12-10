import shutil
import os

from addcorpus.python_corpora.save_corpus import load_and_save_all_corpora

def test_field_order_python_corpus(small_mock_corpus, admin_client, tmpdir, settings):
	# check field order matches corpus definition
	response = admin_client.get('/api/corpus/')
	corpus_data = next(c for c in response.data if c['name'] == small_mock_corpus)
	field_names = [field['name'] for field in corpus_data['fields']]
	assert field_names == ['date', 'title', 'content', 'genre']

	# copy corpus definition into tmpdir
	current_dir = os.path.join(settings.BASE_DIR, 'corpora_test', 'small')
	shutil.copytree(current_dir, tmpdir, dirs_exist_ok=True)

	definition_path = os.path.join(tmpdir, 'small_mock_corpus.py')

	with open(definition_path, 'r') as definition_file:
		definition_str = definition_file.read()

	# replace `fields = [...]` line in file to change field order
	definition_str = definition_str.replace(
		'fields = [date, title_field, content, genre]',
		'fields = [title_field, content, genre, date]'
	)

	# save edited definition
	with open(definition_path, 'w') as definition_file:
		definition_file.write(definition_str)

	# check order has changed
	settings.CORPORA[small_mock_corpus] = definition_path
	load_and_save_all_corpora()

    # Okay this test will never work because it actually just looks at the es_index ordering of fields....
	response = admin_client.get('/api/corpus/')
	corpus_data = next(c for c in response.data if c['name'] == small_mock_corpus)

	field_names = [field['name'] for field in corpus_data['fields']]
	assert field_names == ['title', 'content', 'genre', 'date']
