
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'keka_server.settings')
django.setup()

from core.models import Posts

def check_and_fix_comments():
    posts = Posts.objects.all()
    total_comments = 0
    missing_id_count = 0
    fixed_count = 0
    
    for post in posts:
        if not post.comments:
            continue
            
        modified = False
        comments = post.comments
        
        # Determine max current ID
        max_id = max([c.get('id', 0) for c in comments if isinstance(c.get('id'), (int, float))], default=0)
        
        for c in comments:
            total_comments += 1
            if 'id' not in c or c.get('id') is None or c.get('id') == 'undefined':
                missing_id_count += 1
                max_id += 1
                c['id'] = max_id
                modified = True
                fixed_count += 1
        
        if modified:
            post.comments = comments
            post.save()
            print(f"Fixed {fixed_count} comments in Post {post.id}")

    print(f"Finished! Total Comments: {total_comments}, Missing IDs: {missing_id_count}, Fixed: {fixed_count}")

if __name__ == "__main__":
    check_and_fix_comments()
