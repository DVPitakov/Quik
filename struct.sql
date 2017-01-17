-- MySQL dump 10.13  Distrib 5.7.15, for Linux (x86_64)
--
-- Host: localhost    Database: forum
-- ------------------------------------------------------
-- Server version	5.7.15-0ubuntu0.16.04.1-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `followers`
--

DROP TABLE IF EXISTS `followers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `followers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstUser` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `secondUser` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `firstUser_id` int(11) NOT NULL,
  `secondUser_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `firstSecondUser` (`firstUser_id`,`secondUser_id`),
  KEY `secondFirstUser` (`secondUser_id`,`firstUser_id`),
  KEY `firstSecond` (`firstUser`,`secondUser`)
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER followers_insert_before BEFORE INSERT ON followers
FOR EACH ROW
BEGIN
 SET NEW.firstUser_id = (SELECT uid FROM users WHERE uemail = NEW.firstUser LIMIT 1);
 SET NEW.secondUser_id = (SELECT uid FROM users WHERE uemail = NEW.secondUser LIMIT 1);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `forums`
--

DROP TABLE IF EXISTS `forums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forums` (
  `fid` int(11) NOT NULL AUTO_INCREMENT,
  `fname` char(60) COLLATE utf8_unicode_ci NOT NULL,
  `fshort_name` char(60) COLLATE utf8_unicode_ci NOT NULL,
  `fuser` char(60) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`fid`),
  UNIQUE KEY `fname` (`fname`),
  UNIQUE KEY `fshort_name` (`fshort_name`),
  KEY `fuser` (`fuser`)
) ENGINE=MyISAM AUTO_INCREMENT=209 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `pparent` int(11) DEFAULT NULL,
  `pl0` int(11) NOT NULL DEFAULT '-1',
  `pil0` int(11) NOT NULL DEFAULT '1000000001',
  `pl1` int(11) NOT NULL DEFAULT '-1',
  `pl2` int(11) NOT NULL DEFAULT '-1',
  `pl3` int(11) NOT NULL DEFAULT '-1',
  `pl4` int(11) NOT NULL DEFAULT '-1',
  `pl5` int(11) NOT NULL DEFAULT '-1',
  `pl6` int(11) NOT NULL DEFAULT '-1',
  `pl7` int(11) NOT NULL DEFAULT '-1',
  `pl8` int(11) NOT NULL DEFAULT '-1',
  `pl9` int(11) NOT NULL DEFAULT '-1',
  `pl10` int(11) NOT NULL DEFAULT '-1',
  `pl11` int(11) NOT NULL DEFAULT '-1',
  `pisApproved` tinyint(1) DEFAULT '0',
  `pisHighlighted` tinyint(1) DEFAULT '0',
  `pisEdited` tinyint(1) DEFAULT '0',
  `pisSpam` tinyint(1) DEFAULT '0',
  `pisDeleted` tinyint(1) DEFAULT '0',
  `pdate` datetime NOT NULL,
  `pthread` int(11) NOT NULL,
  `pmessage` text COLLATE utf8_unicode_ci NOT NULL,
  `puser` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `pforum` char(60) COLLATE utf8_unicode_ci NOT NULL,
  `plikes` int(11) NOT NULL DEFAULT '0',
  `pdislikes` int(11) NOT NULL DEFAULT '0',
  `ppoints` int(11) NOT NULL DEFAULT '0',
  `puser_id` int(11) NOT NULL,
  `puser_name` char(60) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`pid`),
  KEY `pdate` (`pdate`),
  KEY `pforum_pdate` (`pforum`,`pdate`),
  KEY `pthread_pdate` (`pthread`,`pdate`),
  KEY `puser_pdate` (`puser`,`pdate`,`pid`),
  KEY `puser_id_pdate` (`puser_id`,`pdate`),
  KEY `puser_id_pforum_puser_name` (`puser_id`,`pforum`,`puser_name`),
  KEY `pforum_puser_name` (`pforum`,`puser_name`),
  KEY `pl0` (`pl0`),
  KEY `pil0` (`pil0`),
  KEY `pthread_pl0_11` (`pthread`,`pl0`,`pl1`,`pl2`,`pl3`,`pl4`,`pl5`,`pl6`,`pl7`,`pl8`,`pl9`,`pl10`,`pl11`),
  KEY `pthread_pil0_11` (`pthread`,`pil0`,`pl1`,`pl2`,`pl3`,`pl4`,`pl5`,`pl6`,`pl7`,`pl8`,`pl9`,`pl10`,`pl11`)
) ENGINE=MyISAM AUTO_INCREMENT=1000001 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER threads_posts_update AFTER UPDATE ON posts
FOR EACH ROW
BEGIN
IF OLD.pisDeleted = 0 AND NEW.pisDeleted = 1 THEN
 UPDATE threads SET tposts = tposts - 1 WHERE tid = NEW.pthread;
ELSEIF OLD.pisDeleted = 1 AND NEW.pisDeleted = 0 THEN
 UPDATE threads SET tposts = tposts + 1 WHERE tid = NEW.pthread;
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `sid` int(6) NOT NULL AUTO_INCREMENT,
  `suser` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `sthread` int(11) NOT NULL,
  PRIMARY KEY (`sid`),
  KEY `sthread` (`sthread`),
  KEY `suserSthread` (`suser`,`sthread`)
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `threads`
--

DROP TABLE IF EXISTS `threads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `threads` (
  `tid` int(11) NOT NULL AUTO_INCREMENT,
  `tdate` datetime NOT NULL,
  `tforum` char(60) COLLATE utf8_unicode_ci NOT NULL,
  `tisClosed` tinyint(1) NOT NULL,
  `tisDeleted` tinyint(1) DEFAULT '0',
  `tmessage` text COLLATE utf8_unicode_ci NOT NULL,
  `tslug` text COLLATE utf8_unicode_ci NOT NULL,
  `ttitle` text COLLATE utf8_unicode_ci NOT NULL,
  `tuser` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `tlikes` int(11) DEFAULT '0',
  `tdislikes` int(11) DEFAULT '0',
  `tpoints` int(11) DEFAULT '0',
  `tposts` int(11) DEFAULT '0',
  PRIMARY KEY (`tid`),
  KEY `tdate` (`tdate`),
  KEY `tuser_tdate` (`tuser`,`tdate`),
  KEY `tforum_tdate` (`tforum`,`tdate`)
) ENGINE=MyISAM AUTO_INCREMENT=40169 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `uid` int(11) NOT NULL AUTO_INCREMENT,
  `uusername` char(60) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uabout` text COLLATE utf8_unicode_ci,
  `uname` char(60) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uemail` char(30) COLLATE utf8_unicode_ci NOT NULL,
  `uisAnonymous` tinyint(1) DEFAULT '0',
  `usubscription_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `uemail` (`uemail`)
) ENGINE=MyISAM AUTO_INCREMENT=381719 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER users_update AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE posts SET puser_name = NEW.uname WHERE puser_id = NEW.uid;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-01-16 21:18:45
