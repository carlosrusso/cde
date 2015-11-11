/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

package pt.webdetails.cdf.dd.render;

import junit.framework.Assert;
import org.apache.commons.io.FileUtils;
import org.json.JSONException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.w3c.dom.CDATASection;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;

public class CdaRendererTest {
  CdaRenderer cdaRenderer;

  private static final String CDFDE_FILE = "test-resources/datasources/scripting/test-scripting.cdfde";

  private static Document stringToDom( String xmlSource ) throws Exception {
    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
    DocumentBuilder builder = factory.newDocumentBuilder();
    return builder.parse( new InputSource( new StringReader( xmlSource ) ) );
  }

  @Before
  public void setup() throws IOException, JSONException {
    cdaRenderer = new CdaRendererForTesting( FileUtils.readFileToString( new File( CDFDE_FILE ) ) );
  }

  @After
  public void tearDown() throws Exception {
    cdaRenderer = null;
  }

  @Test
  public void testRender() throws Exception {
    // this is the .cda file content ( that would have been saved / stored )
    Document dom = stringToDom( cdaRenderer.render() );

    NodeList cDADescriptor = dom.getElementsByTagName( "CDADescriptor" );
    Assert.assertNotNull( cDADescriptor );
    Assert.assertTrue( cDADescriptor.getLength() == 1 );

    NodeList dataSources = dom.getElementsByTagName( "DataSources" );
    Assert.assertNotNull( dataSources );
    Assert.assertTrue( dataSources.getLength() == 1 );

    NodeList connections = dom.getElementsByTagName( "Connection" );
    Assert.assertNotNull( connections );
    Assert.assertTrue( connections.getLength() == 1 );

    Node connection = connections.item( 0 );
    Assert.assertEquals( connection.getAttributes().getNamedItem( "id" ).getNodeValue(), "testQueryFTW" );

    NodeList dataAccesses = dom.getElementsByTagName( "DataAccess" );
    Assert.assertNotNull( dataSources );
    Assert.assertTrue( dataSources.getLength() == 1 );

    Node dataAccess = dataAccesses.item( 0 );
    Assert.assertEquals( dataAccess.getAttributes().getNamedItem( "access" ).getNodeValue(), "public" );
    Assert.assertEquals( dataAccess.getAttributes().getNamedItem( "connection" ).getNodeValue(), "testQueryFTW" );
    Assert.assertEquals( dataAccess.getAttributes().getNamedItem( "id" ).getNodeValue(), "testQueryFTW" );
    Assert.assertEquals( dataAccess.getAttributes().getNamedItem( "type" ).getNodeValue(), "scriptable" );
    NodeList nodes = dataAccess.getChildNodes();
    Node el;
    for ( int i = 0; i < nodes.getLength(); i++ ) {
      el = nodes.item( i );
      switch ( el.getNodeName() ) {
        case "Name":
          Assert.assertEquals( el.getFirstChild().getNodeValue(), "testQueryFTW" );
          break;
        case "Cache":
          Assert.assertEquals( el.getAttributes().getNamedItem( "duration" ).getNodeValue(), "3600" );
          Assert.assertEquals( el.getAttributes().getNamedItem( "enabled" ).getNodeValue(), "true" );
          break;
        case "Query":
          Assert.assertEquals( el.getFirstChild().getNodeType(), CDATASection.CDATA_SECTION_NODE );
          Assert.assertEquals(
              el.getFirstChild().getNodeValue(),
              "import org.pentaho.reporting.engine.classic.core.util"
              + ".TypedTableModel;\n\n"
              + "String[] columnNames = new String[]{\n"
              + "\"value\",\"name2\"\n"
              + "};\n\n\n"
              + "Class[] columnTypes = new Class[]{\n"
              + "Integer.class,\n"
              + "String.class\n"
              + "};\n\n"
              + "TypedTableModel model = new TypedTableModel(columnNames, columnTypes);\n\n"
              + "model.addRow(new Object[]{ new Integer(\"0\"), new String(\"Name\") });\n\n"
              + "return model;" );
          break;
      }
    }
  }
}
