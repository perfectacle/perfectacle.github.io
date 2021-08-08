---
title: (git) 정리 노트
date: 2016-11-19 16:55:28
category: [Middle-end, git]
tag: [형상 관리, 버전 관리, 배포, git]
---
![](git-Reference/thumb.png)
**이 포스트는 git을 접하다 보면 마주치는 다양한 상황들에 대해 대처하기 위해 정리한 글이다.**  
Ctrl+F 키를 눌러 원하시는 키워드를 검색하시면 다양한 케이스들을 볼 수 있다.  
이 문서는 계속해서 업데이트 될 예정이고, 댓글로 제보 해주면 감사할 것 같다 >_<  
혹시 문제 해결이 되지 않는다면 검색 키워드들을 조합해서 검색해보길 바란다.  
취소, 되돌아가기, 삭제: undo, reset, remove   
되돌아가기: revert, retrieve  
특정: specific  
미작동: not working  

## [.gitignore가 작동하지 않을 때](http://stackoverflow.com/questions/11451535/gitignore-not-working)  
검색 키워드: .gitignore not working
```
git rm -r --cached .
git add .
git commit -m "fixed untracked files"
```
커밋 메시지는 자기 입맛에 맞게 수정하면 된다.

## [특정 브랜치 클론하기](http://stackoverflow.com/questions/1911109/how-to-clone-a-specific-git-branch)  
검색 키워드: git specific branch clone
```
git clone -b <브랜치명> <원격 저장소 주소> <폴더명>
```
폴더명을 입력하지 않으면 원격 저장소 이름으로 폴더가 생성된다.

## [특정 커밋 클론하기](http://stackoverflow.com/questions/3555107/git-clone-particular-version-of-remote-repository)  
검색 키워드: git clone specific commit
```
git clone <원격 저장소 주소> <폴더명>
cd <폴더명>
git reset --hard <커밋 해시>
```
한 번에 땡겨오는 명령어는 없는 것 같다.

## [add한 파일 취소시키기](http://stackoverflow.com/questions/348170/how-to-undo-git-add-before-commit)  
검색 키워드: git undo add
```
git reset <file>
```
커밋을 하기 전에 add한 파일을 취소시킬 때 유용하다.  
add한 모든 파일을 취소 시키려면 file을 빼고 입력하면 된다.  
git status를 찍어보면 untracked 상태로 돌아간 걸 확인할 수 있다.

## [특정 커밋으로 돌아가기](http://stackoverflow.com/questions/17667023/git-how-to-reset-origin-master-to-a-commit)
검색 키워드: git reset commit to master
```
git reset --hard <커밋 해시>
// 아래까지 하면 리모트 저장소까지 돌림.
git push --force origin master
```

## [로컬에서 가장 최근 커밋 삭제](http://stackoverflow.com/questions/927358/how-to-undo-last-commits-in-git)
검색 키워드: git reset recent commit
```
git reset HEAD~
```
git log --oneline을 찍어보면 가장 최근 커밋이 날아간 걸 볼 수 있다.

## [리모트 저장소 특정 커밋까지 삭제](http://stackoverflow.com/questions/1270514/undoing-a-git-push)
검색 키워드: git undo remote push
```
git push -f <리모트 저장소 이름> <삭제하기 직전 커밋 해시:브랜치 이름>
```
삭제하기 직전 커밋까지만 살고 그 이후의 커밋은 날아간다.

## [워킹 디렉토리 깔끔하게 하기](http://stackoverflow.com/questions/4327708/git-reset-hard-head-leaves-untracked-files-behind)
검색 키워드: git reset untracked files
```
git clean -f -d
```
untracked 파일들이 날아간다.  
특정 커밋으로 돌아갔을 때 잡다구레한 파일들을 날릴 때 유용하다.

## [로컬/리모트 브랜치 삭제하기](http://stackoverflow.com/questions/2003505/how-to-delete-a-git-branch-both-locally-and-remotely)
검색 키워드: git remove remote branch
```
git branch -d branch_name
git push origin :<branch_name>
```
순서대로 로컬/리모트 저장소에서 브랜치를 삭제하는 명령어이다.

## [Alias](https://git-scm.com/book/ko/v2/Git%EC%9D%98-%EA%B8%B0%EC%B4%88-Git-Alias)
```
git config --global alias.unstage "reset HEAD --"
git unstage fileA
git reset HEAD fileA
```
첫 번째 라인에서 alias(별칭)을 글로벌로 선언함.  
2, 3번 라인은 동일함.

## [add와 commit 동시에 하기](#)
```
git config --global alias.commitx '!git add . && git commit -a -m '
git commitx "커밋 메시지"
```
명령어 두 개가 혼재돼있을 때는 첫 명령어에 !을 붙여야 정상 작동한다.  
윈도우에서는 '' 대신에 ""을 써야 작동하는 것 같다
add와 commit을 매번하기 귀찮으므로 필자가 자주 쓰는 alias이다.

## [alias 관리](#)
```
git config --get-regexp alias
git config --global --unset alias.untage
```
첫 번째 라인은 alias 목록을 보여주고,  
두 번째 라인은 alias를 삭제해주는 역할을 한다.

## [commit 메세지에 timestamp 넣기.](http://stackoverflow.com/questions/4654437/how-to-set-current-date-as-git-commit-message)
검색 키워드: git commit message time
```
git commit -m "`date`"
git commit -m "`date +\"%Y/%m/%d %H:%M:%S\"`"
```
첫 번째 라인은 Sun Dec 4 22:12:42 KST 2016 같은 형식으로 커밋 메시지가 나오고
두 번째 라인은 2016/12/04 22:25:13 같은 형식으로 커밋 메시지가 나온다.

## [로컬 저장소를 원격 저장소로부터 싱크 맞추기](http://stackoverflow.com/questions/6373277/git-sync-local-repo-with-remote-one)
검색 키워드: git sync with remote
```
git fetch // 커밋 로그들만 받아옴.
git reset --hard origin/<your-working-branch>
```

## [로컬 브랜치 이름 바꾸기](http://stackoverflow.com/questions/6591213/how-do-i-rename-a-local-git-branch)
검색 키워드: git branch rename
```
git branch -m <oldname> <newname>
git branch -m <newname> // 현재 브랜치
```