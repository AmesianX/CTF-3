Hi there!

TL; DR:
'trustworthy' is a windows challenge, which allows you to upload a binary and execute under a sandboxed environment. What you need to do is to get the flag inside the server.exe.

Server environment :
Windows Server 2016 64-bit with the latest updates installed (14393.2068). The challenge should also work on Windows 10.

Distribution package breakdown :
1. README.txt - this readme file explains how challenge works
2. deploy.bat - the deploy script we used to deploy the service, some details are removed.
3. sandbox.exe, jsoncpp.dll - the sandbox program used by the service to execute your binary, details can be found at https://github.com/marche147/sandbox
4. sandbox.json - sandbox configuration with some details removed.
5. server.exe - this executable provides service for printing the flag, local copies have fake flag inside while the correct flag is in our server, RE this for more details.

How the service.py (the challenge interface) works :
1. Players connect to the service, and the service asks you for a proof-of-work.
2. After verifing the proof-of-work, the service asks you for the executable.
3. The service saves your program A.
4. The service executes your binary using the sandbox.exe and the config in sandbox.json. (You won't have input to the program.)
5. The service dumps the output to you.
6. The service deletes your program A.

Both the service.py and the server.exe are running under SYSTEM privilege. If you want to have a shell running locally with SYSTEM privilege, try PsExec from SysInternals suite.
Since this is an experimental challenge, you can contact @shiki7 in IRC if you have any question. 

Some F.A.Q.s :

1. Q: My program cannot be started under the sandboxed environment. A: Try to tweak the parameters in sandbox.json, you should try to figure out what is limited by the sandbox. The solution should work under the sandboxed environment.
2. Q: I'm not getting output from the server even though my program does print something out. A: Maybe the reason for not receiving output is buffering. Solutions could be: (1) Disable `stdout` buffering. (2) Flush stream after print. (3) Remove code that forces your program to exit (e.g. ExitProcess, _exit).

Really hope you'll enjoy solving this challenge. Good luck!

-- shiki7

