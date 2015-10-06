<?
$datestamp = date("Y-m-d");      // Current date to append to filename of backup file in format of YYYY-MM-DD

/* CONFIGURE THE FOLLOWING SEVEN VARIABLES TO MATCH YOUR SETUP */
$dbuser = "cbppfbi0_spdash2";            // Database username
$dbpwd = "6EJ2zl^;bsD.";            // Database password
$dbname = "cbppfbi0_sp-dashboard";            // Database name. Use --all-databases if you have more than one
$filename= "backup-$datestamp.sql.gz";   // The name (and optionally path) of the dump file
$to = "nkasprak@cbpp.org";      // Email address to send dump file to
$from = "nkasprak@cbpp.org";      // Email address message will show as coming from.
$subject = "State Priorities Database Backup";      // Subject of email

$command = "mysqldump -h 127.0.0.1 -u ". $dbuser. " --password='". $dbpwd . "' " . $dbname . " | gzip > " .$filename;

$result = passthru($command);

$attachmentname = array_pop(explode("/", $filename));  
// If a path was included, strip it out for the attachment name/

$message = "Compressed database backup file $attachmentname attached.";
$mime_boundary = "<<<:" . md5(time());
$data = chunk_split(base64_encode(implode("", file($filename))));

$headers = "From: $from\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-type: multipart/mixed;\r\n";
$headers .= " boundary=\"".$mime_boundary."\"\r\n";

$content = "This is a multi-part message in MIME format.\r\n\r\n";
$content.= "--".$mime_boundary."\r\n";
$content.= "Content-Type: text/plain; charset=\"iso-8859-1\"\r\n";
$content.= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$content.= $message."\r\n";
$content.= "--".$mime_boundary."\r\n";
$content.= "Content-Disposition: attachment;\r\n";
$content.= "Content-Type: Application/Octet-Stream; name=\"$attachmentname\"\r\n";
$content.= "Content-Transfer-Encoding: base64\r\n\r\n";
$content.= $data."\r\n";
$content.= "--" . $mime_boundary . "\r\n";

mail($to, $subject, $content, $headers);
unlink($filename);   //delete the backup file from the server
?>